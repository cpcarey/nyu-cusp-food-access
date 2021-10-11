from enum import IntEnum
from flask import Flask
from flask_cors import CORS, cross_origin
from flask_restful import Api, Resource, reqparse
from google.cloud import bigquery
from datetime import datetime
import numpy as np
import pandas as pd
import os

PROJECT_ID = 'project-usifood'
DATASET_ID = 'dataset_1'
TABLE_ID = 'table_2'
TABLE_TRIP_ID = 'table_weekly_trips_by_cbg'
TABLE_DEVICE_COUNT_ID = 'table_device_count'

TABLE_PATH = f'{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}'
TABLE_TRIP_PATH = f'{PROJECT_ID}.{DATASET_ID}.{TABLE_TRIP_ID}'
TABLE_DEVICE_COUNT_PATH = f'{PROJECT_ID}.{DATASET_ID}.{TABLE_DEVICE_COUNT_ID}'

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = (
        './private/project-usifood-f2b17ebaac92.json')

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
api = Api(app)

ATTRIBUTE_CHOICES = ('naics_code')

parser = reqparse.RequestParser()
parser.add_argument('a', choices=ATTRIBUTE_CHOICES)
parser.add_argument('aggs')
parser.add_argument('aggt')
parser.add_argument('av')
parser.add_argument('cds')
parser.add_argument('cde')
parser.add_argument('ds')
parser.add_argument('de')
parser.add_argument('m')

class AggregationType(IntEnum):
    AVG = 0
    MEDIAN = 1
    SUM = 2

class NaicsCodeGroup(IntEnum):
    SUPERMARKETS = 0
    GENERAL = 1
    RESTAURANTS = 2
    COMMUNITY = 3
    SUPPLEMENTS = 4
    TOBACCO_LIQUOR = 5

class MetricType(IntEnum):
    RAW_VISITOR_COUNTS = 0
    DENSITY = 1
    HIGH_DENSITY_VISITOR_COUNTS = 2

METRIC_NAMES_POI = {
    MetricType.RAW_VISITOR_COUNTS: 'raw_visitor_counts',
}

METRIC_NAMES_HOME = {
    MetricType.RAW_VISITOR_COUNTS: 'visitor_count',
}

NAICS_CODES = {
    NaicsCodeGroup.SUPERMARKETS: [
        4452, 445210, 445220, 445230, 445291, 445292, 445299, 311811, 445110],
    NaicsCodeGroup.GENERAL: [4539, 445120, 452319, 453998, 452210],
    NaicsCodeGroup.RESTAURANTS: [7225, 722511, 722513, 722514, 722515],
    NaicsCodeGroup.COMMUNITY: [624210, 722320],
    NaicsCodeGroup.SUPPLEMENTS: [446110, 446191],
    NaicsCodeGroup.TOBACCO_LIQUOR: [445310, 453991, 722410],
}

class CbgHomeQuery(Resource):
    def get(self):
        args = parser.parse_args()

        t1 = f'`{TABLE_PATH}`'
        t2 = f'`{TABLE_TRIP_PATH}`'
        t3 = f'`{TABLE_DEVICE_COUNT_PATH}`'

        # Direction filter.
        cbg_attribute = 'visitor_home_cbg_id'

        # Date filter.
        primary_date_start = args['ds']
        primary_date_end = args['de']
        comparison_date_start = args['cds']
        comparison_date_end = args['cde']
        compare = (comparison_date_start != None and comparison_date_end != None)

        # Attribute filter.
        attribute = args['a']
        attribute_value = args['av']
        attribute_sql = f' AND {attribute} = {attribute_value}'
        if attribute == 'naics_code':
            naics_codes = NAICS_CODES[int(attribute_value)]
            attribute_value_sql = ', '.join([str(s) for s in naics_codes])
            attribute_value_sql = f'({attribute_value_sql})'
            attribute_sql = f'AND {attribute} IN {attribute_value_sql}'

        # Metric query predicate.
        metric = int(args['m'])
        metric_sql = ''
        filter_sqls = []
        if metric in METRIC_NAMES_HOME:
            metric = METRIC_NAMES_HOME[metric]
            metric_sql = f'({t2}.visitor_count / {t3}.device_count * 7)'
        elif metric == MetricType.DENSITY:
            metric = 'density'
            metric_sql = f'({t2}.visitor_count / {t3}.device_count * 7)'
            filter_sqls = f' AND {t1}.area_square_feet IS NOT NULL'
            filter_sqls = f' AND {t1}.raw_visitor_counts / {t1}.area_square_feet > 0.005'
        elif metric == MetricType.HIGH_DENSITY_VISITS:
            metric_sql = f'({t2}.visitor_count / {t3}.device_count * 7) * ({t1}.raw_visitor_counts / {t1}.area_square_feet)'
            filter_sqls = f' AND {t1}.area_square_feet IS NOT NULL'
            filter_sqls = f' AND {t1}.raw_visitor_counts / {t1}.area_square_feet > 0.005'

        # Metric aggregation method.
        temporal_aggregation_type = int(args['aggt'])
        metric_aggregate = f'{metric_sql} as metric_agg'
        temporal_aggregation_function = ''
        if temporal_aggregation_type == AggregationType.SUM:
            temporal_aggregation_function = 'sum'
        elif temporal_aggregation_type == AggregationType.AVG:
            temporal_aggregation_function = 'mean'
        elif temporal_aggregation_type == AggregationType.MEDIAN:
            temporal_aggregation_function = 'median'

        query_primary = ''
        query_primary += f'SELECT'
        query_primary += f' {t2}.visitor_home_cbg_id,'
        query_primary += f' {t1}.date_range_start,'
        query_primary += f' SUM({metric_sql})'
        query_primary += f' FROM {t1}'
        query_primary += f' INNER JOIN {t2}'
        query_primary += f'  ON {t1}.placekey = {t2}.placekey'
        query_primary += f'  AND {t1}.date_range_start = {t2}.date_range_start'
        query_primary += f' INNER JOIN {t3}'
        query_primary += f'  ON {t2}.visitor_home_cbg_id = {t3}.origin_census_block_group'
        query_primary += f' WHERE {t1}.date_range_start'
        query_primary += f'  BETWEEN TIMESTAMP("{primary_date_start}")'
        query_primary += f'  AND TIMESTAMP("{primary_date_end}")'
        for filter_sql in filter_sqls:
            query_primary += filter_sql
        query_primary += f' {attribute_sql}'
        query_primary += ' GROUP BY '
        query_primary += f' {t2}.visitor_home_cbg_id,'
        query_primary += f' {t1}.date_range_start'

        query_compare = ''
        query_compare += f'SELECT'
        query_compare += f' {t2}.visitor_home_cbg_id,'
        query_compare += f' {t1}.date_range_start,'
        query_compare += f' SUM({metric_sql})'
        query_compare += f' FROM {t1}'
        query_compare += f' INNER JOIN {t2}'
        query_compare += f'  ON {t1}.placekey = {t2}.placekey'
        query_compare += f'  AND {t1}.date_range_start = {t2}.date_range_start'
        query_compare += f' INNER JOIN {t3}'
        query_compare += f'  ON {t2}.visitor_home_cbg_id = {t3}.origin_census_block_group'
        query_compare += f' WHERE {t1}.date_range_start'
        query_compare += f'  BETWEEN TIMESTAMP("{comparison_date_start}")'
        query_compare += f'  AND TIMESTAMP("{comparison_date_end}")'
        for filter_sql in filter_sqls:
            query_compare += filter_sql
        query_compare += f' {attribute_sql}'
        query_compare += ' GROUP BY '
        query_compare += f' {t2}.visitor_home_cbg_id,'
        query_compare += f' {t1}.date_range_start'

        client = bigquery.Client()
        job_config = bigquery.QueryJobConfig()

        response_primary = client.query(query_primary, job_config=job_config)
        if compare:
            response_compare = (
                    client.query(query_compare, job_config=job_config))

        primary_date_origin = datetime.fromisoformat(primary_date_start)
        rows_primary = []
        for row in response_primary:
            row = list(row)
            row[1] = (row[1].replace(tzinfo=None) - primary_date_origin).days
            rows_primary.append(row)

        if compare:
            comparison_date_origin = (
                    datetime.fromisoformat(comparison_date_start))
            rows_compare = []
            for row in response_compare:
                row = list(row)
                row[1] = (
                        row[1].replace(tzinfo=None) -
                        comparison_date_origin).days
                rows_compare.append(row)

        df_primary = pd.DataFrame.from_records(
                rows_primary,
                columns=['home_cbg', 'date_offset', 'value'])
        df = df_primary

        if compare:
            df_compare = pd.DataFrame.from_records(
                    rows_compare,
                    columns=['home_cbg', 'date_offset', 'value'])
            df = df_primary.merge(
                    df_compare,
                    how='inner', on=['home_cbg', 'date_offset'],
                    suffixes=('_primary', '_comparison'))
            df = df[df['value_primary'] > 0]
            df = df[df['value_comparison'] > 0]
            df['value_diff'] = df['value_primary'] - df['value_comparison']
        else:
            df['value_diff'] = df['value']

        # Aggregate per POI over dates.
        gdf = df.groupby(by=['home_cbg']).agg({
            'value_diff': temporal_aggregation_function}).reset_index()

        values = dict(zip(gdf['home_cbg'], gdf['value_diff']))

        results = {
            'query': query_primary,
            'response': values,
        }

        return results

class CbgPoiQuery(Resource):
    def get(self):
        args = parser.parse_args()
        attribute = args['a']
        attribute_value = args['av']
        attribute_sql = f' AND {attribute} = {attribute_value}'

        # Date filter.
        primary_date_start = args['ds']
        primary_date_end = args['de']
        comparison_date_start = args['cds']
        comparison_date_end = args['cde']
        compare = (comparison_date_start != None and comparison_date_end != None)

        # Metric query predicate.
        metric = int(args['m'])
        metric_sql = ''
        filter_sqls = []
        if metric in METRIC_NAMES_POI:
            metric = METRIC_NAMES_POI[metric]
            metric_sql = metric
        elif metric == MetricType.DENSITY:
            metric = 'density'
            metric_sql = '(raw_visitor_counts / area_square_feet)'
            filter_sqls = ' AND area_square_feet IS NOT NULL'

        # Attribute filter.
        if attribute == 'naics_code':
            naics_codes = NAICS_CODES[int(attribute_value)]
            attribute_value_sql = ', '.join([str(s) for s in naics_codes])
            attribute_value_sql = f'({attribute_value_sql})'
            attribute_sql = f'AND {attribute} IN {attribute_value_sql}'

        # Metric aggregation method.
        temporal_aggregation_type = int(args['aggt'])
        temporal_aggregation_function = ''
        if temporal_aggregation_type == AggregationType.SUM:
            temporal_aggregation_function = 'sum'
        elif temporal_aggregation_type == AggregationType.AVG:
            temporal_aggregation_function = 'mean'
        elif temporal_aggregation_type == AggregationType.MEDIAN:
            temporal_aggregation_function = 'median'
        spatial_aggregation_type = int(args['aggs'])
        spatial_aggregation_function = ''
        if spatial_aggregation_type == AggregationType.SUM:
            spatial_aggregation_function = 'sum'
        elif spatial_aggregation_type == AggregationType.AVG:
            spatial_aggregation_function = 'mean'
        elif spatial_aggregation_type == AggregationType.MEDIAN:
            spatial_aggregation_function = 'median'

        query_primary = ''
        query_primary += 'SELECT'
        query_primary += ' poi_cbg,'
        query_primary += ' placekey,'
        query_primary += ' date_range_start AS primary_date_range_start,'
        query_primary += f' SUM({metric_sql})'
        query_primary += f' FROM `{TABLE_PATH}`'
        query_primary += ' WHERE date_range_start'
        query_primary += f'  BETWEEN TIMESTAMP("{primary_date_start}")'
        query_primary += f'  AND TIMESTAMP("{primary_date_end}")'
        for filter_sql in filter_sqls:
            query_primary += filter_sql
        query_primary += f' {attribute_sql}'
        query_primary += ' GROUP BY poi_cbg, placekey, primary_date_range_start'
        query_primary += ' ORDER BY poi_cbg, placekey, primary_date_range_start'

        query_compare = ''
        query_compare += 'SELECT'
        query_compare += ' poi_cbg,'
        query_compare += ' placekey,'
        query_compare += ' date_range_start AS comparison_date_range_start,'
        query_compare += f' SUM({metric_sql})'
        query_compare += f' FROM `{TABLE_PATH}`'
        query_compare += ' WHERE date_range_start'
        query_compare += f'  BETWEEN TIMESTAMP("{comparison_date_start}")'
        query_compare += f'  AND TIMESTAMP("{comparison_date_end}")'
        for filter_sql in filter_sqls:
            query_compare += filter_sql
        query_compare += f' {attribute_sql}'
        query_compare += ' GROUP BY poi_cbg, placekey, comparison_date_range_start'
        query_compare += ' ORDER BY poi_cbg, placekey, comparison_date_range_start'

        client = bigquery.Client()
        job_config = bigquery.QueryJobConfig()

        response_primary = client.query(query_primary, job_config=job_config)
        if compare:
            response_compare = (
                    client.query(query_compare, job_config=job_config))

        primary_date_origin = datetime.fromisoformat(primary_date_start)
        rows_primary = []
        for row in response_primary:
            row = list(row)
            row[2] = (row[2].replace(tzinfo=None) - primary_date_origin).days
            rows_primary.append(row)

        if compare:
            comparison_date_origin = (
                    datetime.fromisoformat(comparison_date_start))
            rows_compare = []
            for row in response_compare:
                row = list(row)
                row[2] = (
                        row[2].replace(tzinfo=None) -
                        comparison_date_origin).days
                rows_compare.append(row)

        df_primary = pd.DataFrame.from_records(
                rows_primary,
                columns=['poi_cbg', 'placekey', 'date_offset', 'value'])
        df = df_primary

        if compare:
            df_compare = pd.DataFrame.from_records(
                    rows_compare,
                    columns=['poi_cbg', 'placekey', 'date_offset', 'value'])
            df = df_primary.merge(
                    df_compare,
                    how='inner', on=['placekey', 'poi_cbg', 'date_offset'],
                    suffixes=('_primary', '_comparison'))
            df = df[df['value_primary'] > 0]
            df = df[df['value_comparison'] > 0]
            df['value_diff'] = df['value_primary'] - df['value_comparison']
        else:
            df['value_diff'] = df['value']

        # Aggregate per POI over dates.
        gdf = df.groupby(by=['placekey']).agg({
            'poi_cbg': 'first',
            'value_diff': temporal_aggregation_function}).reset_index()

        # Aggregate per CBG over POIs.
        gdf = gdf.groupby(by=['poi_cbg']).agg({
            'value_diff': spatial_aggregation_function}).reset_index()

        values = dict(zip(gdf['poi_cbg'], gdf['value_diff']))

        results = {
            'query': query_primary,
            'response': values,
        }

        return results


api.add_resource(CbgHomeQuery, '/cbg/home/q')
api.add_resource(CbgPoiQuery, '/cbg/poi/q')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
