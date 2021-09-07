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

  function handleAggregationTypeChange(e, configState) {
    setConfigState({
      ...configState,
      aggregationType: parseInt(e.target.value),
    });
  }

  function handleAttributeClassChange(e, configState) {
    setConfigState({
      ...configState,
      attributeClass: parseInt(e.target.value),
    });
  }

  function handleDateEndChange(e, configState) {
    // Ensure start date is at least seven days before end date.
    const dateEndString = e.target.value;
    const dateEnd = new Date(dateEndString);
    const dateStartMax = new Date(dateEndString);
    dateStartMax.setDate(dateEnd.getDate() - 7);
    let dateStart = new Date(configState.dateStart);
    if (dateStart > dateStartMax) {
      dateStart = dateStartMax;
    }
    const dateStartString = dateStart.toISOString().split('T')[0];

    setConfigState({
      ...configState,
      dateEnd: dateEndString,
      dateStart: dateStartString,
    });
  }

  function handleDateStartChange(e, configState) {
    // Ensure end date is at least seven days after end date.
    const dateStartString = e.target.value;
    const dateStart = new Date(dateStartString);
    const dateEndMin = new Date(dateStartString);
    dateEndMin.setDate(dateStart.getDate() + 7);
    let dateEnd = new Date(configState.dateEnd);
    if (dateEnd < dateEndMin) {
      dateEnd = dateEndMin;
    }
    const dateEndString = dateEnd.toISOString().split('T')[0];

    setConfigState({
      ...configState,
      dateEnd: dateEndString,
      dateStart: dateStartString,
    });
  }

  let controls;
  // TODO: Move checkbox to its own component.
  if (side === 0) {
    controls =
        <div className="panel-controls">
          <div className="panel-control dropdown">
            <div>Visualization</div>
            <div className="select-container">
              <select>
                <option value="0">Choropleth</option>
                <option value="1">Trip Network</option>
              </select>
            </div>
          </div>
          <div className="panel-control date-picker">
            <div>Start Date</div>
            <div>
              <input
                max="2021-03-01"
                min="2020-03-01"
                onChange={(e) => handleDateStartChange(e, configState)}
                type="date"
                value={configState.dateStart}
                />
            </div>
          </div>
          <div className="panel-control date-picker">
            <div>End Date</div>
            <div>
              <input
                max="2021-03-01"
                min="2020-03-02"
                onChange={(e) => handleDateEndChange(e, configState)}
                type="date"
                value={configState.dateEnd}
                />
            </div>
          </div>
          <div className="panel-control dropdown">
            <div>Attribute</div>
            <div className="select-container">
              <select>
                <option value="0">NAICS Code Group</option>
              </select>
            </div>
          </div>
          <div className="panel-control dropdown">
            <div>Attribute Class</div>
            <div className="select-container">
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
            <div className="select-container">
              <select>
                <option value="0">Visitors</option>
                <option value="1">Density</option>
              </select>
            </div>
          </div>
          <div className="panel-control dropdown">
            <div>Aggregation</div>
            <div className="select-container">
              <select onChange={(e) => handleAggregationTypeChange(e, configState)}>
                <option value="0">AVG</option>
                <option value="1">MEDIAN</option>
                <option value="2">SUM</option>
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
