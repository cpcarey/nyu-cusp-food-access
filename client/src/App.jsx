import React, {useState} from 'react';
import {ChartPanel} from 'ChartPanel.jsx';
import {DataMap} from 'DataMap.jsx';
import {QueryPanel} from 'QueryPanel.jsx';

import {AggregationType, AttributeType, MetricType, NaicsCodeGroup, VisualizationType} from 'enum.js';

import './App.css';

function App() {
  const [dataState, setDataState] = useState({
    cbgNormalizedValueMap: new Map(),
    cbgStandardizedValueMap: new Map(),
    cbgValueMap: new Map(),
  });

  const [mapState, setMapState] = useState({
    hoveredCbg: null,
  });

  const [queryState, setQueryState] = useState({
    aggregationType: AggregationType.AVG,
    attributeClass: NaicsCodeGroup.SUPERMARKETS,
    attributeType: AttributeType.NAICS_CODE_GROUP,
    dateEnd: '2020-04-01',
    dateStart: '2020-03-01',
    metricType: MetricType.VISITORS,
    visualizationType: VisualizationType.CHOROPLETH,
  });

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
