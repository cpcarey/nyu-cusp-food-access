import React from 'react';
import {DataMap} from 'DataMap.jsx';
import {Panel} from 'Panel.jsx';

import './App.css';

function App() {
  return (
    <div className="app">
      <Panel side={0} />
      <DataMap />
      <Panel side={1} />
    </div>
  );
}

export default App;
