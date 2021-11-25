# NYU CUSP Food Access Capstone Project

Authors: Chris Carey, Maia Guo, Nuoyi Wang

[Project Website](https://chriscarey.tech/nyu/capstone)

## Overview

This repository includes both Jupyter notebooks used for data analysis, and source code for an interactive web application. Data are not stored in this repository due to size and licensing constraints.

The `client` directory contains source code for the React Mapbox JavaScript client application\
The `server` directory contains source code for the Flask and Pandas query processing engine and API\
The `notebooks` directory contains Jupyter notebooks
The `docs` directory contains images.

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
