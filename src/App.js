import React, {useRef, useEffect, useState} from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import {tokens} from 'private-tokens';

import './App.css';

mapboxgl.accessToken = tokens.mapbox;

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng] = useState(-70.9);
  const [lat] = useState(42.35);
  const [zoom] = useState(9);

  useEffect(() => {
    if (map.current) {
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: zoom,
    });
  });

  return (
    <div className="App">
      <header className="App-header">
        NYU CUSP Capstone
      </header>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default App;
