import {useState} from 'react';

import './Panel.css';

export function Panel({
  side, homeCbg, poiCbg, setHomeCbg, setPoiCbg, setTripNetwork, tripNetwork,
}) {
  const [expanded, setExpanded] = useState(false);

  const classNamePanel = [
    'panel',
    side ? 'panel-right' : 'panel-left',
    expanded ? 'expanded' : '',
  ].filter((className) => className.length).join(' ');
  const classNameIcon = side ? 'far fa-chart-bar' : 'fas fa-cog';


  let controls;
  // TODO: Move checkbox to its own component.
  if (side === 0) {
    controls =
        <div className="panel-controls">
          <div className="panel-control">
            <div>POI CBGs</div>
            <input
              checked={poiCbg}
              onChange={() => setPoiCbg(!poiCbg)}
              type="checkbox"
              />
          </div>
          <div className="panel-control">
            <div>Home CBGs</div>
            <input
              checked={homeCbg}
              onChange={() => setHomeCbg(!homeCbg)}
              type="checkbox"
              />
          </div>
          <div className="panel-control">
            <div>Trip Network</div>
            <input
              checked={tripNetwork}
              onChange={() => setTripNetwork(!tripNetwork)}
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
