from enum import IntEnum
from flask import Flask
from flask_cors import CORS, cross_origin
from flask_restful import Api, Resource, reqparse
from google.cloud import bigquery
from datetime import datetime
import numpy as np
import pandas as pd
import os
import itertools

PROJECT_ID = 'project-usifood'
DATASET_ID = 'dataset_1'
TABLE_ID = 'poi_health_recatgorized'
TABLE_TRIP_ID = 'weekly_trips_by_home_cbg'
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

ATTRIBUTE_CHOICES = ('category')

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
    BEER_WINE_AND_LIQUOR_STORES = 0
    BIG_BOX_GROCERS = 1
    DELIS_AND_CONVENIENCE_STORES = 2
    DRINKING_PLACES = 3
    FAST_FOOD_RESTAURANTS = 4
    FOOD_SERVICES = 5
    FULL_SERVICE_RESTAURANTS = 6
    GENERAL_MERCHANDISE_STORES = 7
    LIMITED_SERVICE_RESTAURANTS = 8
    PHARMACIES_AND_DRUG_STORES = 9
    SNACKS_AND_BAKERIES = 10
    SPECIALTY_FOOD_STORES = 11
    SUPERMARKETS = 12
    TOBACCO_STORES = 13

class MetricType(IntEnum):
    ESTIMATED_VISITOR_COUNT = 0
    PERCENT_ESTIMATED_VISITOR_COUNT = 1
    CROWDING_DENSITY_INDEX = 4

METRIC_NAMES_HOME = {
    MetricType.ESTIMATED_VISITOR_COUNT: 'estimated_visitor_count',
}

NAICS_CODE_GROUP_NAMES = {
    NaicsCodeGroup.BEER_WINE_AND_LIQUOR_STORES: ['Beer, Wine, and Liquor Stores'],
    NaicsCodeGroup.BIG_BOX_GROCERS: ['Big Box Grocers'],
    NaicsCodeGroup.DELIS_AND_CONVENIENCE_STORES: ['Delis and Convenience Stores'],
    NaicsCodeGroup.DRINKING_PLACES: ['Drinking Places'],
    NaicsCodeGroup.FAST_FOOD_RESTAURANTS: ['Fast-Food Restaurants'],
    NaicsCodeGroup.FOOD_SERVICES: ['Food Services'],
    NaicsCodeGroup.FULL_SERVICE_RESTAURANTS: ['Full-Service Restaurants'],
    NaicsCodeGroup.GENERAL_MERCHANDISE_STORES: ['General Merchandise Stores'],
    NaicsCodeGroup.LIMITED_SERVICE_RESTAURANTS: ['Limited-Service Restaurants'],
    NaicsCodeGroup.PHARMACIES_AND_DRUG_STORES: ['Pharmacies and Drug Stores'],
    NaicsCodeGroup.SNACKS_AND_BAKERIES: ['Snacks and Bakeries'],
    NaicsCodeGroup.SPECIALTY_FOOD_STORES: ['Specialty Food Stores'],
    NaicsCodeGroup.SUPERMARKETS: ['Supermarkets'],
    NaicsCodeGroup.TOBACCO_STORES: ['Tobacco Stores'],
}

FILTERED_CBGS = set([
    360050001001, # Rikers Island
])

t1 = f'`{TABLE_PATH}`'
t2 = f'`{TABLE_TRIP_PATH}`'
# t3 = f'`{TABLE_DEVICE_COUNT_PATH}`'

def process_data_frames(df_primary, df_compare, config):
    df_primary = calculate_percent_diff(df_primary, config)
    df_compare = calculate_percent_diff(df_compare, config)

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
    df_values = df_values[~df_values[config.cbg_key].isin(FILTERED_CBGS)]

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
    codes_1 = NAICS_CODE_GROUP_NAMES[int(config.key_attr_class_primary)]

    # Spatially aggregate metric across all POIs per naics code per CBG per week.
    df_all = df.groupby(by=[config.cbg_key, 'date_offset', config.key_attr]).agg({
        'value': 'sum'}).reset_index()

    cbgs = set(df_all[config.cbg_key])
    date_offsets = set(df_all['date_offset'])

    # Create zero-filled dataframe of all permutations to preserve missing rows
    # as zero when summing.
    df_full = pd.DataFrame(
            list(itertools.product(*[cbgs, date_offsets])),
            columns=[config.cbg_key, 'date_offset'])
    df_full['value'] = 0

    df1 = df[df['category'].isin(codes_1)]
    df1 = df1.groupby(by=[config.cbg_key, 'date_offset']).agg({
        'value': config.spatial_aggregation_function}).reset_index()
    df1 = df_full.merge(
            df1, how='left',
            on=[config.cbg_key, 'date_offset'])
    df1['value'] = df1['value_x'] + df1['value_y']

    if config.compare_attr_classes:
        codes_2 = NAICS_CODES[int(config.key_attr_class_compare)]
        df2 = df[df['naics_code'].isin(codes_2)]
        df2 = df2.groupby(by=[config.cbg_key, 'date_offset']).agg({
            'value': config.spatial_aggregation_function}).reset_index()
        df2 = df_full.merge(
                df2, how='left',
                on=[config.cbg_key, 'date_offset'])
        df2['value'] = df2['value_x'] + df2['value_y']

    # Subtract metric % of class 1 from metric % of class 2.
    if config.compare_attr_classes:
        df_diff = df_full
        df_diff['value'] = df1['value'] - df2['value']

        # Reset index now that corresponding percentages have been compared
        # and differenced.
        df_diff = df_diff.reset_index().dropna()
        return df_diff
    else:
        df1 = df1.reset_index().dropna()
        return df1

class CbgHomeQuery(Resource):
    def get(self):
        # Parse HTTP request.
        args = parser.parse_args()
        http_query = HttpQuery(args)
        query_config = QueryConfig(http_query)
        query_config.cbg_key = 'home_cbg'

        # Form query.
        sql_query = SqlQuery(http_query, query_config)
        query_config.aggregation_function_temporal = (
                sql_query.temporal_aggregation_function)
        query = sql_query.get_query_home(query_config)

        # Make query.
        client = bigquery.Client()
        job_config = bigquery.QueryJobConfig()
        response = client.query(query, job_config=job_config)

        # Process query.
        date_origin_primary = datetime.fromisoformat(sql_query.date_start_primary)
        if query_config.compare_dates:
            date_origin_compare = (
                    datetime.fromisoformat(sql_query.date_start_compare))
        rows_primary = []
        rows_compare = []
        for row in response:
            row = list(row)
            dt = row[1].replace(tzinfo=None)
            # Split rows based on time period.
            if dt >= date_origin_primary:
                row[1] = (dt - date_origin_primary).days
                rows_primary.append(row)
            else:
                row[1] = (dt - date_origin_compare).days
                rows_compare.append(row)

        # Create data frames.
        df_columns = [query_config.cbg_key, 'date_offset', 'value', query_config.key_attr]
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
            'query': query,
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
        self.spatial_aggregation_type = int(args['aggs'])

class QueryConfig:
    key_cbg = ''
    key_attr = ''
    key_attr_class_primary = ''
    key_attr_class_compare = ''
    compare_dates = False
    compare_attr_classes = False
    aggregation_function_temporal = 0

    def __init__(self, http_query):
        self.key_attr = http_query.attr
        self.key_attr_class_primary = http_query.attr_value_primary
        self.key_attr_class_compare = http_query.attr_value_compare
        self.compare_dates = (http_query.date_start_compare != None and
                              http_query.date_end_compare != None)
        self.compare_attr_classes = http_query.attr_value_compare != None

        self.spatial_aggregation_function = ''
        if http_query.spatial_aggregation_type == AggregationType.SUM:
            self.spatial_aggregation_function = 'sum'
        elif http_query.spatial_aggregation_type == AggregationType.AVG:
            self.spatial_aggregation_function = 'mean'
        elif http_query.spatial_aggregation_type == AggregationType.MEDIAN:
            self.spatial_aggregation_function = 'median'

        self.percent = (http_query.metric == MetricType.PERCENT_ESTIMATED_VISITOR_COUNT)

class SqlQuery:
    def __init__(self, http_query, query_config):
        self.date_end_compare = http_query.date_end_compare
        self.date_end_primary = http_query.date_end_primary
        self.date_start_compare = http_query.date_start_compare
        self.date_start_primary = http_query.date_start_primary

        # Attribute filter.
        self.attr = http_query.attr
        self.attr_sql = ''

        # Metric query predicate.
        self.metric_sql = ''
        self.filter_sqls = []

        if http_query.metric == MetricType.ESTIMATED_VISITOR_COUNT:
            self.metric_sql = f'{t2}.esimated_visitor_count'
        elif http_query.metric == MetricType.PERCENT_ESTIMATED_VISITOR_COUNT:
            self.metric_sql = f'{t2}.pct_estimated_visitor_count'
        elif http_query.metric == MetricType.CROWDING_DENSITY_INDEX:
            self.metric_sql = f'{t2}.esimated_visitor_count * {t1}.raw_visitor_counts / {t1}.area_square_feet'
            self.filter_sqls = f' AND {t1}.area_square_feet IS NOT NULL'
            self.filter_sqls = f' AND {t2}.esimated_visitor_count * {t1}.raw_visitor_counts / {t1}.area_square_feet > 0.0005'

        # Temporal aggregation method.
        self.metric_aggregate = f'{self.metric_sql} as metric_agg'
        self.temporal_aggregation_function = ''
        if http_query.temporal_aggregation_type == AggregationType.SUM:
            self.temporal_aggregation_function = 'sum'
        elif http_query.temporal_aggregation_type == AggregationType.AVG:
            self.temporal_aggregation_function = 'mean'
        elif http_query.temporal_aggregation_type == AggregationType.MEDIAN:
            self.temporal_aggregation_function = 'median'

        # There is only one entry per home CBG, week, and NAICS code.
        self.aggregation_sql = f'SUM({self.metric_sql})'

    def get_query_home(self, query_config):
        q = ''
        q += f'SELECT'
        q += f' {t2}.visitor_home_cbg_id,'
        q += f' {t2}.date_range_start,'
        q += f' {self.aggregation_sql},'
        q += f' {t1}.{self.attr}'
        q += f' FROM {t1}'
        q += f' INNER JOIN {t2}'
        q += f'  ON {t1}.placekey = {t2}.placekey'
        q += f' WHERE {t2}.date_range_start'
        q += f'  BETWEEN TIMESTAMP("{self.date_start_primary}")'
        q += f'  AND TIMESTAMP("{self.date_end_primary}")'
        if query_config.compare_dates:
            q += f'  OR {t2}.date_range_start'
            q += f'  BETWEEN TIMESTAMP("{self.date_start_compare}")'
            q += f'  AND TIMESTAMP("{self.date_end_compare}")'
        for filter_sql in self.filter_sqls:
            q += filter_sql
        q += f' {self.attr_sql}'
        q += ' GROUP BY '
        q += f' {t2}.visitor_home_cbg_id,'
        q += f' {t2}.date_range_start,'
        q += f' {t1}.{self.attr}'
        return q

api.add_resource(CbgHomeQuery, '/cbg/home/q')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
