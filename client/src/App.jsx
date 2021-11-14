import React, {useEffect, useState} from 'react';
import {ChartPanel} from 'ChartPanel.jsx';
import {DataMap} from 'DataMap.jsx';
import {QueryPanel} from 'QueryPanel.jsx';

import {
  AggregationType, AttributeType, MapPlotType,
  MetricType, NaicsCodeGroup, VisualizationType,
} from 'enum.js';

import './App.css';

const queryStateSessionStorageParsers = {
  attributeClass: (datum) => parseInt(datum),
  attributeType: (datum) => parseInt(datum),
  compareDates: (datum) => datum === 'true',
  comparisonDateEnd: (datum) => datum,
  comparisonDateStart: (datum) => datum,
  dateEnd: (datum) => datum,
  dateStart: (datum) => datum,
  metricType: (datum) => parseInt(datum),
  spatialAggregationType: (datum) => parseInt(datum),
  temporalAggregationType: (datum) => parseInt(datum),
  visualizationType: (datum) => parseInt(datum),
};

/** @return {!QueryState} */
function createDefaultQueryState() {
  return {
    attributeClass: NaicsCodeGroup.SUPERMARKETS,
    attributeType: AttributeType.NAICS_CODE_GROUP,
    compareDates: true,
    comparisonDateEnd: '2019-04-03',
    comparisonDateStart: '2019-03-03',
    dateEnd: '2020-04-01',
    dateStart: '2020-03-01',
    metricType: MetricType.DENSITY,
    spatialAggregationType: AggregationType.MEDIAN,
    temporalAggregationType: AggregationType.AVG,
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
  const [appState, setAppState] = useState({
    loading: false,
  });

  const [dataState, setDataState] = useState({
    cbgNormalizedValueMap: new Map(),
    cbgStandardizedValueMap: new Map(),
    cbgValueMap: new Map(),
  });

  const [hoverState, setHoverState] = useState({
    cbg: null,
  });

  const [mapState, setMapState] = useState({
    plotType: MapPlotType.CHOROPLETH,
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
        appState={appState}
        dataState={dataState}
        hoverState={hoverState}
        mapState={mapState}
        queryState={queryState}
        setAppState={setAppState}
        setDataState={setDataState}
        setHoverState={setHoverState}
        setMapState={setMapState}
        />
      <ChartPanel
        dataState={dataState}
        hoverState={hoverState}
        />
    </div>
  );
}

export default App;
