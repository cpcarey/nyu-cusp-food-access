# NYU CUSP Food Access Capstone Project

Authors: Chris Carey, Maia Guo, Nuoyi Wang

[Project Website](https://chriscarey.tech/nyu/capstone)

## Abstract

The COVID-19 pandemic had a complex impact on food acquisition behaviors in New York City (NYC). Pre-existing disparities in food access and food supply resiliency compounded negative health risks for certain populations by exacerbating food insecurity, increasing dependencies on unhealthy food, and creating disproportionate risks of COVID-19 infection during food acquisition. Mobility data of trips to food retail and service locations were used to supplement existing survey data to model and analyze changes in food acquisition in NYC during the pandemic. Demographic and socioeconomic clustering was employed in time series analyses of metrics modeling dietary changes and COVID-19 infection risk. These analyses identified neighborhoods and food location categories with the greatest need for more resilient food access and supply. While direct connections to health outcomes were not established in this paper, the produced measures identified the locations and relative degrees of disparities in dietary changes associated with negative health outcomes. Therefore, combined with community and expert knowledge, such a holistic model can inform the most effective means to direct equitable policy-driven improvements to the food system resilience of NYC, in preparation for future public health emergencies.

## Repository Overview

This repository includes both Jupyter notebooks used for data analysis, and source code for an interactive web application. Data are not stored in this repository due to size and licensing constraints.

The `client` directory contains source code for the React Mapbox JavaScript client application\
The `server` directory contains source code for the Flask and Pandas query processing engine and API\
The `notebooks` directory contains Jupyter notebooks
The `docs` directory contains images.

## Visualization Application

![Screenshot of Client Application](./docs/app1.png)

## Installing client

 1. Navigate to the `client/` directory
 2. Create a folder in the directory named `private`.
 3. Add the following JavaScript file inside `private` named `tokens.js`:
 ```
  export const tokens = {
    mapbox: '<INSERT_YOUR_MAPBOX_API_TOKEN_HERE>',
  };
 ```
 4. `npm install`


## Running client

 1. `npm start`


## Installing server

 1. Navigate to the `server/query/` directory
 2. Create a folder in the directory named `private`.
 3. Add the team-provided BigQuery access token
 4. Run in a `conda` environmment with `flask` and `pandas` installed

## Running server

 1. `python app.py`
