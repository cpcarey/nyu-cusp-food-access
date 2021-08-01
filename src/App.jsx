import React from 'react';
import {DataMap} from 'DataMap.jsx';

import './App.css';

function App() {
  return (
    <div className="app">
      <div className="panel panel-left"></div>
      <DataMap />
      <div className="panel panel-right"></div>
    </div>
  );
}

export default App;
