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
parser.add_argument('cav')
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

t1 = f'`{TABLE_PATH}`'
t2 = f'`{TABLE_TRIP_PATH}`'
t3 = f'`{TABLE_DEVICE_COUNT_PATH}`'

def process_data_frames(df_primary, df_compare, config):
    if config.compare_attr_classes:
        df_primary = calculate_percent_diff(df_primary, config)
        df_compare = calculate_percent_diff(df_compare, config)

        df_primary = df_primary[df_primary['value'] != 0]
        df_compare = df_compare[df_compare['value'] != 0]

    df_values = df_primary

    if config.compare_dates:
       df_values = df_primary.merge(
               df_compare,
               how='inner', on=[config.cbg_key, 'date_offset'],
               suffixes=('_primary', '_comparison'))
       df_values['value'] = (
               df_values['value_primary'] -
               df_values['value_comparison'])

    df_values = aggregate_temporally(df_values, config)
    values = dict(zip(df_values[config.cbg_key], df_values['value']))
    return values

def aggregate_temporally(df, config):
    # Aggregate per POI over dates.
    df = df.groupby(by=[config.cbg_key]).agg({
        'value': config.aggregation_function_temporal}).reset_index()
    df = df.dropna(subset=['value'])
    return df

def calculate_percent_diff(df, config):
    # Segment dataframe by attribute class.
    codes_1 = NAICS_CODES[int(config.key_attr_class_primary)]
    codes_2 = NAICS_CODES[int(config.key_attr_class_compare)]
    df1 = df[df['naics_code'].isin(codes_1)]
    df2 = df[df['naics_code'].isin(codes_2)]

    # Spatially aggregate metric across all POIs per CBG per week.
    df_all = df.groupby(by=[config.cbg_key, 'date_offset']).agg({
        'value': 'sum'})
    df1 = df1.groupby(by=[config.cbg_key, 'date_offset']).agg({
        'value': 'sum'})
    df2 = df2.groupby(by=[config.cbg_key, 'date_offset']).agg({
        'value': 'sum'})

    # Subtract metric % of class 1 from metric % of class 2.
    df_diff = df_all
    df_diff['value'] = (
            df2['value'] / df_all['value'] -
            df1['value'] / df_all['value'])

    # Reset index now that corresponding percentages have been compared
    # and differenced.
    df_diff = df_diff.reset_index()
    return df_diff

class CbgHomeQuery(Resource):
    def get(self):
        # Parse HTTP request.
        args = parser.parse_args()
        http_query = HttpQuery(args)
        query_config = QueryConfig(http_query)
        query_config.cbg_key = 'home_cbg'

        # Form queries.
        sql_query = SqlQuery(http_query, query_config)
        query_config.aggregation_function_temporal = (
                sql_query.temporal_aggregation_function)
        query_primary = sql_query.get_query_home_primary(query_config)
        query_compare = sql_query.get_query_home_compare(query_config)

        # Make queries.
        client = bigquery.Client()
        job_config = bigquery.QueryJobConfig()
        response_primary = client.query(query_primary, job_config=job_config)
        if query_config.compare_dates:
            response_compare = (
                    client.query(query_compare, job_config=job_config))

        # Process queries.
        date_origin_primary = datetime.fromisoformat(sql_query.date_start_primary)
        rows_primary = []
        for row in response_primary:
            row = list(row)
            row[1] = (row[1].replace(tzinfo=None) - date_origin_primary).days
            rows_primary.append(row)

        if query_config.compare_dates:
            date_origin_compare = (
                    datetime.fromisoformat(sql_query.date_start_compare))
            rows_compare = []
            for row in response_compare:
                row = list(row)
                row[1] = (
                        row[1].replace(tzinfo=None) -
                        date_origin_compare).days
                rows_compare.append(row)

        # Create data frames.
        df_columns = [query_config.cbg_key, 'date_offset', 'value']
        if query_config.compare_attr_classes:
            df_columns.append('naics_code')
        df_primary = pd.DataFrame.from_records(
                rows_primary,
                columns=df_columns)
        df_compare = pd.DataFrame.from_records(
                rows_primary,
                columns=df_columns)
        df_compare['value'].values[:] = 0
        if query_config.compare_dates:
            df_compare = pd.DataFrame.from_records(
                    rows_compare,
                    columns=df_columns)

        # Transform data frames.
        values = process_data_frames(df_primary, df_compare, query_config)

        # Return results.
        results = {
            'query': query_primary,
            'response': values,
        }

        return results

class HttpQuery:
    def __init__(self, args):
        self.attr = args['a']
        self.attr_value_compare = args['cav']
        self.attr_value_primary = args['av']
        self.date_end_compare = args['cde']
        self.date_end_primary = args['de']
        self.date_start_compare = args['cds']
        self.date_start_primary = args['ds']
        self.metric = int(args['m'])
        self.temporal_aggregation_type = int(args['aggt'])

class SqlQuery:
    def __init__(self, http_query, query_config):
        self.date_end_compare = http_query.date_end_compare
        self.date_end_primary = http_query.date_end_primary
        self.date_start_compare = http_query.date_start_compare
        self.date_start_primary = http_query.date_start_primary

        # Attribute filter.
        self.attr = http_query.attr
        self.attr_sql = f' AND {http_query.attr} = {http_query.attr_value_primary}'

        if http_query.attr == 'naics_code':
            naics_codes = NAICS_CODES[int(http_query.attr_value_primary)]
            attr_value_sql = ', '.join([str(s) for s in naics_codes])
            attr_value_sql = f'({attr_value_sql})'
            self.attr_sql = f'AND {http_query.attr} IN {attr_value_sql}'

        # Comparison attribute filter.
        if query_config.compare_attr_classes:
            # all_values = []
            # attr_value_sql = ''
            # for naics_codes in NAICS_CODES.values():
                # all_values += [str(s) for s in naics_codes]
            # attr_value_sql += ', '.join(all_values)
            # attr_value_sql = f'({attr_value_sql})'
            self.attr_sql = ''#f'AND {attr} IN {attr_value_sql}'

        # Metric query predicate.
        self.metric_sql = ''
        self.filter_sqls = []

        if query_config.cbg_key == 'poi_cbg':
            if http_query.metric == MetricType.RAW_VISITOR_COUNTS:
                self.metric_sql = f'({t1}.raw_visitor_counts / {t3}.device_count * 7)'
            elif http_query.metric == MetricType.DENSITY:
                self.metric_sql = f'({t1}.raw_visitor_counts / {t3}.device_count * 7)'
                self.filter_sqls = f' AND {t1}.area_square_feet IS NOT NULL'
                self.filter_sqls = f' AND {t1}.raw_visitor_counts / {t1}.area_square_feet > 0.005'
            elif http_query.metric == MetricType.HIGH_DENSITY_VISITS:
                self.metric_sql = f'({t2}.visitor_count / {t3}.device_count * 7) * ({t1}.raw_visitor_counts / {t1}.area_square_feet)'
                self.filter_sqls = f' AND {t1}.area_square_feet IS NOT NULL'
                self.filter_sqls = f' AND {t1}.raw_visitor_counts / {t1}.area_square_feet > 0.005'
        elif query_config.cbg_key == 'home_cbg':
            if http_query.metric == MetricType.RAW_VISITOR_COUNTS:
                self.metric_sql = f'({t2}.visitor_count / {t3}.device_count * 7)'
            elif http_query.metric == MetricType.DENSITY:
                self.metric_sql = f'({t2}.visitor_count / {t3}.device_count * 7)'
                self.filter_sqls = f' AND {t1}.area_square_feet IS NOT NULL'
                self.filter_sqls = f' AND {t1}.raw_visitor_counts / {t1}.area_square_feet > 0.005'
            elif http_query.metric == MetricType.HIGH_DENSITY_VISITS:
                self.metric_sql = f'({t2}.visitor_count / {t3}.device_count * 7) * ({t1}.raw_visitor_counts / {t1}.area_square_feet)'
                self.filter_sqls = f' AND {t1}.area_square_feet IS NOT NULL'
                self.filter_sqls = f' AND {t1}.raw_visitor_counts / {t1}.area_square_feet > 0.005'

        # Metric aggregation method.
        self.metric_aggregate = f'{self.metric_sql} as metric_agg'
        self.temporal_aggregation_function = ''
        if http_query.temporal_aggregation_type == AggregationType.SUM:
            self.temporal_aggregation_function = 'sum'
        elif http_query.temporal_aggregation_type == AggregationType.AVG:
            self.temporal_aggregation_function = 'mean'
        elif http_query.temporal_aggregation_type == AggregationType.MEDIAN:
            self.temporal_aggregation_function = 'median'

    def get_query_home_primary(self, query_config):
        q = ''
        q += f'SELECT'
        q += f' {t2}.visitor_home_cbg_id,'
        q += f' {t1}.date_range_start,'
        q += f' SUM({self.metric_sql})'
        if query_config.compare_attr_classes:
            q += f', {self.attr}'
        q += f' FROM {t1}'
        q += f' INNER JOIN {t2}'
        q += f'  ON {t1}.placekey = {t2}.placekey'
        q += f'  AND {t1}.date_range_start = {t2}.date_range_start'
        q += f' INNER JOIN {t3}'
        q += f'  ON {t2}.visitor_home_cbg_id = {t3}.origin_census_block_group'
        q += f' WHERE {t1}.date_range_start'
        q += f'  BETWEEN TIMESTAMP("{self.date_start_primary}")'
        q += f'  AND TIMESTAMP("{self.date_end_primary}")'
        for filter_sql in self.filter_sqls:
            q += filter_sql
        q += f' {self.attr_sql}'
        q += ' GROUP BY '
        q += f' {t2}.visitor_home_cbg_id,'
        q += f' {t1}.date_range_start'
        if query_config.compare_attr_classes:
            q += f', {self.attr}'
        return q

    def get_query_home_compare(self, query_config):
        if not query_config.compare_dates:
            return ''

        q = ''
        q += f'SELECT'
        q += f' {t2}.visitor_home_cbg_id,'
        q += f' {t1}.date_range_start,'
        q += f' SUM({self.metric_sql})'
        if query_config.compare_attr_classes:
            q += f', {self.attr}'
        q += f' FROM {t1}'
        q += f' INNER JOIN {t2}'
        q += f'  ON {t1}.placekey = {t2}.placekey'
        q += f'  AND {t1}.date_range_start = {t2}.date_range_start'
        q += f' INNER JOIN {t3}'
        q += f'  ON {t2}.visitor_home_cbg_id = {t3}.origin_census_block_group'
        q += f' WHERE {t1}.date_range_start'
        q += f'  BETWEEN TIMESTAMP("{self.date_start_compare}")'
        q += f'  AND TIMESTAMP("{self.date_end_compare}")'
        for filter_sql in self.filter_sqls:
            q += filter_sql
        q += f' {self.attr_sql}'
        q += ' GROUP BY '
        q += f' {t2}.visitor_home_cbg_id,'
        q += f' {t1}.date_range_start'
        if query_config.compare_attr_classes:
            q += f', {self.attr}'
        return q

    def get_query_poi_primary(self, query_config):
        q = ''
        q += 'SELECT'
        q += f' {t1}.poi_cbg,'
        q += f' {t1}.date_range_start,'
        q += f' SUM({self.metric_sql})'
        if query_config.compare_attr_classes:
            q += f', {self.attr}'
        q += f' FROM {t1}'
        q += f' INNER JOIN {t3}'
        q += f'  ON {t1}.poi_cbg = {t3}.origin_census_block_group'
        q += f' WHERE {t1}.date_range_start'
        q += f'  BETWEEN TIMESTAMP("{self.date_start_primary}")'
        q += f'  AND TIMESTAMP("{self.date_end_primary}")'
        for filter_sql in self.filter_sqls:
            q += filter_sql
        q += f' {self.attr_sql}'
        q += ' GROUP BY '
        q += f' {t1}.poi_cbg,'
        q += f' {t1}.date_range_start'
        if query_config.compare_attr_classes:
            q += f', {self.attr}'
        return q

    def get_query_poi_compare(self, query_config):
        if not query_config.compare_dates:
            return ''

        q = ''
        q += 'SELECT'
        q += f' {t1}.poi_cbg,'
        q += f' {t1}.date_range_start,'
        q += f' SUM({self.metric_sql})'
        if query_config.compare_attr_classes:
            q += f', {self.attr}'
        q += f' FROM {t1}'
        q += f' INNER JOIN {t3}'
        q += f'  ON {t1}.poi_cbg = {t3}.origin_census_block_group'
        q += f' WHERE {t1}.date_range_start'
        q += f'  BETWEEN TIMESTAMP("{self.date_start_compare}")'
        q += f'  AND TIMESTAMP("{self.date_end_compare}")'
        for filter_sql in self.filter_sqls:
            q += filter_sql
        q += f' {self.attr_sql}'
        q += ' GROUP BY '
        q += f' {t1}.poi_cbg,'
        q += f' {t1}.date_range_start'
        if query_config.compare_attr_classes:
            q += f', {self.attr}'
        return q


class QueryConfig:
    key_cbg = ''
    key_attr = ''
    key_attr_class_primary = ''
    key_attr_class_compare = ''
    compare_dates = False
    compare_attr_classes = False
    aggregation_function_temporal = 0

    def __init__(self, http_query):
        self.key_attr_class_primary = http_query.attr_value_primary
        self.key_attr_class_compare = http_query.attr_value_compare
        self.compare_dates = (http_query.date_start_compare != None and
                              http_query.date_end_compare != None)
        self.compare_attr_classes = http_query.attr_value_compare != None

class CbgPoiQuery(Resource):
    def get(self):
        # Parse HTTP request.
        args = parser.parse_args()
        http_query = HttpQuery(args)
        query_config = QueryConfig(http_query)
        query_config.cbg_key = 'poi_cbg'

        # Form queries.
        sql_query = SqlQuery(http_query, query_config)
        query_config.aggregation_function_temporal = (
                sql_query.temporal_aggregation_function)
        query_primary = sql_query.get_query_poi_primary(query_config)
        query_compare = sql_query.get_query_poi_compare(query_config)

        # Make queries.
        client = bigquery.Client()
        job_config = bigquery.QueryJobConfig()
        response_primary = client.query(query_primary, job_config=job_config)
        if query_config.compare_dates:
            response_compare = (
                    client.query(query_compare, job_config=job_config))

        # Process queries.
        date_origin_primary = datetime.fromisoformat(sql_query.date_start_primary)
        rows_primary = []
        for row in response_primary:
            row = list(row)
            row[1] = (row[1].replace(tzinfo=None) - date_origin_primary).days
            rows_primary.append(row)
        if query_config.compare_dates:
            date_origin_compare = (
                    datetime.fromisoformat(sql_query.date_start_compare))
            rows_compare = []
            for row in response_compare:
                row = list(row)
                row[1] = (
                        row[1].replace(tzinfo=None) -
                        date_origin_compare).days
                rows_compare.append(row)

        # Create data frames.
        df_columns = [query_config.cbg_key, 'date_offset', 'value']
        if query_config.compare_attr_classes:
            df_columns.append('naics_code')
        df_primary = pd.DataFrame.from_records(
                rows_primary,
                columns=df_columns)
        df_compare = pd.DataFrame.from_records(
                rows_primary,
                columns=df_columns)
        df_compare['value'].values[:] = 0
        if query_config.compare_dates:
            df_compare = pd.DataFrame.from_records(
                    rows_compare,
                    columns=df_columns)

        # Transform data frames.
        values = process_data_frames(df_primary, df_compare, query_config)

        # Return results.
        results = {
            'query': query_primary,
            'response': values,
        }

        return results


api.add_resource(CbgHomeQuery, '/cbg/home/q')
api.add_resource(CbgPoiQuery, '/cbg/poi/q')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
