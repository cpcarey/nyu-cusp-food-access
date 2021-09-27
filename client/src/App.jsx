import React, {useEffect, useState} from 'react';
import {ChartPanel} from 'ChartPanel.jsx';
import {DataMap} from 'DataMap.jsx';
import {QueryPanel} from 'QueryPanel.jsx';

import {AggregationDirection, AggregationType, AttributeType, MetricType, NaicsCodeGroup, VisualizationType} from 'enum.js';

import './App.css';

const queryStateSessionStorageParsers = {
  aggregationDirection: (datum) => parseInt(datum),
  aggregationType: (datum) => parseInt(datum),
  attributeClass: (datum) => parseInt(datum),
  attributeType: (datum) => parseInt(datum),
  dateEnd: (datum) => datum,
  dateStart: (datum) => datum,
  metricType: (datum) => parseInt(datum),
  visualizationType: (datum) => parseInt(datum),
};

/** @return {!QueryState} */
function createDefaultQueryState() {
  return {
    aggregationDirection: AggregationDirection.POI,
    aggregationType: AggregationType.MEDIAN,
    attributeClass: NaicsCodeGroup.SUPERMARKETS,
    attributeType: AttributeType.NAICS_CODE_GROUP,
    dateEnd: '2020-04-01',
    dateStart: '2020-03-01',
    metricType: MetricType.DENSITY,
    visualizationType: VisualizationType.CHOROPLETH,
  };
}

/** @return {!QueryState} */
function loadQueryStateFromSession() {
  const queryState = createDefaultQueryState();
  for (const key of Object.keys(queryState)) {
    const item = window.sessionStorage.getItem(key);
    if (item !== null) {
      queryState[key] = queryStateSessionStorageParsers[key](item);
    }
  }
  return queryState;
}

/** @param {!QueryState} */
function saveQueryStateToSession(queryState) {
  for (const key of Object.keys(queryState)) {
    window.sessionStorage.setItem(key, queryState[key]);
  }
}

function App() {
  const [dataState, setDataState] = useState({
    cbgNormalizedValueMap: new Map(),
    cbgStandardizedValueMap: new Map(),
    cbgValueMap: new Map(),
  });

  const [mapState, setMapState] = useState({
    hoveredCbg: null,
  });
  const [queryState, setQueryState] = useState(loadQueryStateFromSession());

  useEffect(() => {
    saveQueryStateToSession(queryState);
  }, [queryState]);

  return (
    <div className="app">
      <QueryPanel
        queryState={queryState}
        setQueryState={setQueryState}
        />
      <DataMap
        dataState={dataState}
        mapState={mapState}
        queryState={queryState}
        setDataState={setDataState}
        setMapState={setMapState}
        />
      <ChartPanel
        dataState={dataState}
        mapState={mapState}
        />
    </div>
  );
}

export default App;
