import React, {useState} from 'react';
import {DataMap} from 'DataMap.jsx';
import {Panel} from 'Panel.jsx';

import {MetricType, NaicsCode, VisualizationType} from 'enum.js';

import './App.css';

function App() {
  const [configState, setConfigState] = useState({
    attributeClass: NaicsCode.SUPERMARKETS,
    metricType: MetricType.DENSITY,
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
