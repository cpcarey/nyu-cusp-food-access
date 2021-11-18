import os
import pyspark
#conf = pyspark.SparkConf()
#spark
from pyspark.sql.functions import * 
from pyspark.sql.types import *


def core_process(sc, spark, path_name, FOOD_CODES):
    
    '''Filter and get food related data.'''
    
    core_col = ['placekey','parent_placekey','location_name','safegraph_brand_ids','brands',\
                'top_category','sub_category','naics_code','latitude','longitude',\
                'street_address','city','region','postal_code','iso_country_code',\
                'open_hours','category_tags','opened_on','closed_on',\
                'tracking_opened_since','tracking_closed_since']
    
    core = spark.read.options(header=True, escape='"').csv(path_name).dropDuplicates()
    # append missing columns
    for i in core_col:
        if i not in core.columns:
            core = core.withColumn(i, lit(None).cast(StringType()))
    core_food = core.filter(col('naics_code').isin(*FOOD_CODES)).select(core_col)
    
    return core_food


def brand_process(sc, spark, path_name, FOOD_CODES):
    
    '''Filter and get food related data.'''
    
    brand_col = ['safegraph_brand_id','brand_name','parent_safegraph_brand_id',\
                 'naics_code','top_category','sub_category',]
    
    brand = spark.read.options(header=True, escape='"').csv(path_name).dropDuplicates()
    brand_food = brand.filter(col('naics_code').isin(*FOOD_CODES)).select(brand_col)
    
    return brand_food


def weekly_process(sc, spark, path_list_file, CBG_CODE_F5):
    
    '''Merge and filter weekly files, and get the data in NYC.'''
    
    # get the file paths and names
    path_name = []
    with open(path_list_file) as f:
        for line in f.readlines():
            line = line.rstrip()
            path_name.append(line)
    
    weekly_col = ['placekey','parent_placekey','safegraph_brand_ids','date_range_start','date_range_end',\
                  'raw_visit_counts','raw_visitor_counts','visits_by_day','visits_by_each_hour','poi_cbg',\
                  'visitor_home_cbgs','visitor_daytime_cbgs','visitor_country_of_origin','distance_from_home',\
                  'median_dwell','bucketed_dwell_times','related_same_day_brand','related_same_week_brand'] 
    
    # create empty dataframe with column names
    weeklySchema = StructType([StructField(c, StringType()) for c in weekly_col])
    weekly = spark.createDataFrame(data=[], schema=weeklySchema)
    
    # read and concatenate the weekly files
    for name in path_name: 
        df = spark.read.options(header=True, escape='"').csv(name)
        ## append missing columns
        for i in weekly_col:
            if i not in df.columns:
                df = df.withColumn(i, lit(None).cast(StringType()))
        ## filter data in NYC by cbg codes, and rearrange the columns
        df = df.filter(substring('poi_cbg',1,5).isin(CBG_CODE_F5)).select(weekly_col)
        ## concatenate to the weekly dataframe
        weekly = weekly.union(df)
    
    return weekly


def social_process(sc, spark, path_name, CBG_CODE_F5):
    
    '''Filter and get the data in NYC.'''
    
    social = spark.read.options(header=True, escape='"').csv(path_name)
    social_nyc = social.filter(substring('origin_census_block_group',1,5).isin(CBG_CODE_F5))
    
    return social_nyc


def main(sc, spark):
    
    # naics_code for food 
    FOOD_CODES = ['4452','4539','7225','311811','445110','445120','445210','445220','445230','445291',\
                  '445292','445299','445310','452319','453991','453998','624210','722320','722410','722511',\
                  '722513','722514','722515','452210','446110','446191']
    # first 5 digits of the poi_cbg to filter data in NYC
    CBG_CODE_F5 = ['36005', '36047', '36061', '36081', '36085'] 
    
    # weekly and core filter
    path_list_file = "weekly_patterns_path.txt"
    weekly_nyc = weekly_process(sc, spark, path_list_file, CBG_CODE_F5)
    core_food = core_process(sc, spark, '/data/share/safegraph/core-places/core_poi-*.csv', FOOD_CODES)
    # weekly & core
    weekly_and_core = weekly_nyc.join(core_food, weekly_nyc.placekey == core_food.placekey, 'inner')\
                                 .drop(core_food.placekey).drop(core_food.parent_placekey).drop(core_food.safegraph_brand_ids)

    # social distancing 
    social_nyc = social_process(sc, spark, '/data/share/safegraph/social-distancing/*-social-distancing*.csv', CBG_CODE_F5)    
    
    # brand info
    brand_food = brand_process(sc, spark, '/data/share/safegraph/core-places/brand_info-*.csv', FOOD_CODES)
    
    # save files - from fast to slow
    brand_food.repartition(1).write.options(header=True, escape='"', quoteAll=True).csv("brand_food")
    social_nyc.repartition(1).write.options(header=True, escape='"', quoteAll=True).csv("social_nyc")  # 1h
    weekly_and_core.repartition(1).write.options(header=True, escape='"', quoteAll=True).csv("weekly_and_core") # 2h

    
if __name__=='__main__':
    sc = pyspark.SparkContext()
    spark = pyspark.sql.SparkSession(sc)
    main(sc, spark)    
    
