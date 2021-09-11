import React, {useState} from 'react';
import {ChartPanel} from 'ChartPanel.jsx';
import {DataMap} from 'DataMap.jsx';
import {QueryPanel} from 'QueryPanel.jsx';

import {AggregationType, AttributeType, MetricType, NaicsCodeGroup, VisualizationType} from 'enum.js';

import './App.css';

function App() {
  const [queryState, setQueryState] = useState({
    aggregationType: AggregationType.AVG,
    attributeClass: NaicsCodeGroup.SUPERMARKETS,
    attributeType: AttributeType.NAICS_CODE_GROUP,
    dateEnd: '2020-04-01',
    dateStart: '2020-03-01',
    metricType: MetricType.VISITORS,
    visualizationType: VisualizationType.CHOROPLETH,
  });

  const [mapState, setMapState] = useState({
    hoveredCbg: null,
  });

  return (
    <div className="app">
      <QueryPanel
        queryState={queryState}
        setQueryState={setQueryState}
        />
      <DataMap
        mapState={mapState}
        queryState={queryState}
        setMapState={setMapState}
        />
      <ChartPanel
        mapState={mapState}
        />
    </div>
  );
}

export default App;
