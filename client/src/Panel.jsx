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

  function handleAttributeClassChange(e, configState) {
    setConfigState({
      ...configState,
      attributeClass: parseInt(e.target.value),
    });
  }

  let controls;
  // TODO: Move checkbox to its own component.
  if (side === 0) {
    controls =
        <div className="panel-controls">
          <div className="panel-control dropdown">
            <div>Visualization</div>
            <div>
              <select>
                <option value="0">Choropleth</option>
                <option value="1">Trip Network</option>
              </select>
            </div>
          </div>
          <div className="panel-control dropdown">
            <div>Attribute Class</div>
            <div>
              <select onChange={(e) => handleAttributeClassChange(e, configState)}>
                <option value="0">Supermarkets</option>
                <option value="1">General Stores</option>
                <option value="2">Restaurants</option>
                <option value="3">Community Food Services</option>
                <option value="4">Supplement Stores</option>
                <option value="5">Tobacco & Liquor Stores</option>
              </select>
            </div>
          </div>
          <div className="panel-control dropdown">
            <div>Metric</div>
            <div>
              <select>
                <option value="0">Density</option>
              </select>
            </div>
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
