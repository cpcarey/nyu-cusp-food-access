import React from 'react';
import ReactDOM from 'react-dom';
import 'mapbox-gl/dist/mapbox-gl.css';
import 'index.css';
import App from 'App.jsx';

ReactDOM.render(
  <React.StrictMode>
    <header className="app-header">
      NYU CUSP Capstone <i className='fas fa-bar-chart'></i>
    </header>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
