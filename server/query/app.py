from enum import IntEnum
from flask import Flask
from flask_cors import CORS, cross_origin
from flask_restful import Api, Resource, reqparse
from google.cloud import bigquery
import os

PROJECT_ID = 'project-usifood'
DATASET_ID = 'dataset_1'
TABLE_ID = 'table_2'
TABLE_PATH = f'{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}'

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = (
        './private/project-usifood-f2b17ebaac92.json')

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
api = Api(app)

ATTRIBUTE_CHOICES = ('naics_code')

parser = reqparse.RequestParser()
parser.add_argument('a', choices=ATTRIBUTE_CHOICES)
parser.add_argument('agg')
parser.add_argument('av')
parser.add_argument('ds')
parser.add_argument('de')

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

NAICS_CODES = {
    NaicsCodeGroup.SUPERMARKETS: [
        4452, 445210, 445220, 445230, 445291, 445292, 445299, 311811, 445110],
    NaicsCodeGroup.GENERAL: [4539, 445120, 452319, 453998, 452210],
    NaicsCodeGroup.RESTAURANTS: [7225, 722511, 722513, 722514, 722515],
    NaicsCodeGroup.COMMUNITY: [624210, 722320],
    NaicsCodeGroup.SUPPLEMENTS: [446110, 446191],
    NaicsCodeGroup.TOBACCO_LIQUOR: [445310, 453991, 722410],
}

class Query(Resource):
    def get(self):
        args = parser.parse_args()
        attribute = args['a']
        attribute_value = args['av']
        attribute_sql = f' AND {attribute} = {attribute_value}'
        metric = 'raw_visitor_counts'

        aggregation_type = int(args['agg'])
        metric_aggregate = f'{metric}_agg'

        if attribute == 'naics_code':
            naics_codes = NAICS_CODES[int(attribute_value)]
            attribute_value_sql = ', '.join([str(s) for s in naics_codes])
            attribute_value_sql = f'({attribute_value_sql})'
            attribute_sql = f'AND {attribute} IN {attribute_value_sql}'

        date_start = args['ds']
        date_end = args['de']

        client = bigquery.Client()

        aggregation_sql = ''
        print(aggregation_type == AggregationType.AVG)
        if aggregation_type == AggregationType.SUM:
            aggregation_sql = f'SUM({metric}) AS {metric_aggregate}'
        elif aggregation_type == AggregationType.AVG:
            aggregation_sql = f'AVG({metric}) AS {metric_aggregate}'
        elif aggregation_type == AggregationType.MEDIAN:
            aggregation_sql = f'fhoffa.x.median(ARRAY_AGG({metric})) AS {metric_aggregate}'

        query = ''
        query += f'SELECT poi_cbg, {aggregation_sql}'
        query += f' FROM `{TABLE_PATH}`'
        query += f' WHERE date_range_start BETWEEN TIMESTAMP("{date_start}")'
        query += f' AND TIMESTAMP("{date_end}")'
        query += f' {attribute_sql}'
        query += ' GROUP BY poi_cbg'

        print(query)

        job_config = bigquery.QueryJobConfig()
        response = client.query(query, job_config=job_config)

        results = {}
        for row in response:
            if row.poi_cbg not in results:
                results[row.poi_cbg] = 0
            results[row.poi_cbg] += row[metric_aggregate]
        return results

api.add_resource(Query, '/q')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
