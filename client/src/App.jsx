import React, {useState} from 'react';
import {DataMap} from 'DataMap.jsx';
import {Panel} from 'Panel.jsx';

import {AggregationType, AttributeType, MetricType, NaicsCodeGroup, VisualizationType} from 'enum.js';

import './App.css';

function App() {
  const [configState, setConfigState] = useState({
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
      <Panel
        configState={configState}
        side={0}
        setConfigState={setConfigState}
        />
      <DataMap
        configState={configState}
        />
      <Panel side={1} />
    </div>
  );
}

export default App;
