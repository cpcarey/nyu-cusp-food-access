import {useState} from 'react';

import './Panel.css';

export function Panel({configState, setConfigState, side}) {
  const [expanded, setExpanded] = useState(false);

  const classNamePanel = [
    'panel',
    side ? 'panel-right' : 'panel-left',
    expanded ? 'expanded' : '',
  ].filter((className) => className.length).join(' ');
  const classNameIcon = side ? 'far fa-chart-bar' : 'fas fa-cog';

  function handleLayerHomeCbgChange(configState) {
    setConfigState({
      ...configState,
      layers: {
        ...configState.layers,
        homeCbg: !configState.layers.homeCbg,
      },
    });
  }

  function handleLayerPoiCbgChange(configState) {
    setConfigState({
      ...configState,
      layers: {
        ...configState.layers,
        poiCbg: !configState.layers.poiCbg,
      },
    });
  }

  function handleLayerTripNetworkChange(configState) {
    setConfigState({
      ...configState,
      layers: {
        ...configState.layers,
        tripNetwork: !configState.layers.tripNetwork,
      },
    });
  }

  let controls;
  // TODO: Move checkbox to its own component.
  if (side === 0) {
    controls =
        <div className="panel-controls">
          <div className="panel-control">
            <div>POI CBGs</div>
            <input
              checked={configState.layers.poiCbg}
              onChange={() => handleLayerPoiCbgChange(configState)}
              type="checkbox"
              />
          </div>
          <div className="panel-control">
            <div>Home CBGs</div>
            <input
              checked={configState.layers.homeCbg}
              onChange={() => handleLayerHomeCbgChange(configState)}
              type="checkbox"
              />
          </div>
          <div className="panel-control">
            <div>Trip Network</div>
            <input
              checked={configState.layers.tripNetwork}
              onChange={() => handleLayerTripNetworkChange(configState)}
              type="checkbox"
              />
          </div>
        </div>;
  }

  return (
    <div className={classNamePanel}>
      {controls}
      <button onClick={() => setExpanded(!expanded)}>
        <i className={classNameIcon}></i>
      </button>
    </div>
  );
}
