import React, {useEffect, useState} from 'react';
import {ChartPanel} from 'ChartPanel.jsx';
import {DataMap} from 'DataMap.jsx';
import {QueryPanel} from 'QueryPanel.jsx';

import {
  AggregationType, AttributeType, MapPlotType,
  MetricType, PoiCategory,
} from 'enum.js';

import './App.css';

const queryStateSessionStorageParsers = {
  attributeClass: (datum) => parseInt(datum),
  attributeType: (datum) => parseInt(datum),
  compareAttributeClasses: (datum) => datum === 'true',
  compareDates: (datum) => datum === 'true',
  comparisonAttributeClass: (datum) => datum,
  comparisonDateEnd: (datum) => datum,
  comparisonDateStart: (datum) => datum,
  datePeriodDuration: (datum) => parseInt(datum),
  dateStart: (datum) => datum,
  mapPlotType: (datum) => parseInt(datum),
  metricType: (datum) => parseInt(datum),
  spatialAggregationType: (datum) => parseInt(datum),
  temporalAggregationType: (datum) => parseInt(datum),
};

/** @return {!QueryState} */
function createDefaultQueryState() {
  return {
    attributeClass: PoiCategory.SUPERMARKETS,
    attributeType: AttributeType.POI_CATEGORY,
    compareAttributeClasses: false,
    compareDates: false,
    comparisonAttributeClass: PoiCategory.DELIS_AND_CONVENIENCE_STORES,
    comparisonDateEnd: '2019-03-09',
    comparisonDateStart: '2019-03-03',
    datePeriodDuration: 3,
    dateStart: '2020-03-01',
    mapPlotType: MapPlotType.CHOROPLETH,
    metricType: MetricType.ESTIMATED_VISITOR_COUNT,
    spatialAggregationType: AggregationType.MEDIAN,
    temporalAggregationType: AggregationType.AVG,
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
