import React, {useState} from 'react';
import {DataMap} from 'DataMap.jsx';
import {Panel} from 'Panel.jsx';

import './App.css';

function App() {
  const [homeCbg, setHomeCbg] = useState(false);
  const [poiCbg, setPoiCbg] = useState(true);
  const [tripNetwork, setTripNetwork] = useState(false);

  return (
    <div className="app">
      <Panel
        side={0}
        homeCbg={homeCbg}
        poiCbg={poiCbg}
        setHomeCbg={setHomeCbg}
        setPoiCbg={setPoiCbg}
        setTripNetwork={setTripNetwork}
        tripNetwork={tripNetwork}
        />
      <DataMap
        homeCbg={homeCbg}
        poiCbg={poiCbg}
        tripNetwork={tripNetwork}
        />
      <Panel side={1} />
    </div>
  );
}

export default App;
