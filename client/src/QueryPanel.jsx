import {useState} from 'react';

import './Panel.css';

export function QueryPanel({queryState, setQueryState}) {
  const [expanded, setExpanded] = useState(true);

  const classNamePanel = [
    'panel',
    'panel-left',
    expanded ? 'expanded' : '',
  ].filter((className) => className.length).join(' ');
  const classNameIcon = 'fas fa-cog';

  /**
   * @param {!Event} e
   * @param {!QueryState} queryState
   */
  function handleAggregationDirectionChange(e, queryState) {
    setQueryState({
      ...queryState,
      aggregationDirection: parseInt(e.target.value),
    });
  }

  /**
   * @param {!Event} e
   * @param {!QueryState} queryState
   */
  function handleAggregationTypeChange(e, queryState) {
    setQueryState({
      ...queryState,
      aggregationType: parseInt(e.target.value),
    });
  }

  /**
   * @param {!Event} e
   * @param {!QueryState} queryState
   */
  function handleAttributeClassChange(e, queryState) {
    setQueryState({
      ...queryState,
      attributeClass: parseInt(e.target.value),
    });
  }

  /**
   * @param {!Event} e
   * @param {!QueryState} queryState
   */
  function handleDateEndChange(e, queryState) {
    // Ensure start date is at least seven days before end date.
    const dateEndString = e.target.value;
    const dateEnd = new Date(dateEndString);
    const dateStartMax = new Date(dateEndString);
    dateStartMax.setDate(dateEnd.getDate() - 7);
    let dateStart = new Date(queryState.dateStart);
    if (dateStart > dateStartMax) {
      dateStart = dateStartMax;
    }
    const dateStartString = dateStart.toISOString().split('T')[0];

    setQueryState({
      ...queryState,
      dateEnd: dateEndString,
      dateStart: dateStartString,
    });
  }

  /**
   * @param {!Event} e
   * @param {!QueryState} queryState
   */
  function handleDateStartChange(e, queryState) {
    // Ensure end date is at least seven days after end date.
    const dateStartString = e.target.value;
    const dateStart = new Date(dateStartString);
    const dateEndMin = new Date(dateStartString);
    dateEndMin.setDate(dateStart.getDate() + 7);
    let dateEnd = new Date(queryState.dateEnd);
    if (dateEnd < dateEndMin) {
      dateEnd = dateEndMin;
    }
    const dateEndString = dateEnd.toISOString().split('T')[0];

    setQueryState({
      ...queryState,
      dateEnd: dateEndString,
      dateStart: dateStartString,
    });
  }

  /**
   * @param {!Event} e
   * @param {!QueryState} queryState
   */
  function handleMetricTypeChange(e, queryState) {
    setQueryState({
      ...queryState,
      metricType: parseInt(e.target.value),
    });
  }

  return (
    <div className={classNamePanel}>
      <div className="panel-controls">
        <div className="panel-control dropdown">
          <div>Aggregation Direction</div>
          <div className="select-container">
            <select
              onChange={(e) => handleAggregationDirectionChange(e, queryState)}>
              <option value="0">POI CBG</option>
              <option value="1">Home CBG</option>
            </select>
          </div>
        </div>
        <div className="panel-control date-picker">
          <div>Start Date</div>
          <div>
            <input
              max="2021-03-01"
              min="2020-03-01"
              onChange={(e) => handleDateStartChange(e, queryState)}
              type="date"
              value={queryState.dateStart}
              />
          </div>
        </div>
        <div className="panel-control date-picker">
          <div>End Date</div>
          <div>
            <input
              max="2021-03-01"
              min="2020-03-02"
              onChange={(e) => handleDateEndChange(e, queryState)}
              type="date"
              value={queryState.dateEnd}
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
            <select onChange={(e) => handleAttributeClassChange(e, queryState)}>
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
            <select onChange={(e) => handleMetricTypeChange(e, queryState)} defaultValue="1">
              <option value="0">Visitor count</option>
              <option value="1">Visitor density</option>
            </select>
          </div>
        </div>
        <div className="panel-control dropdown">
          <div>Aggregation</div>
          <div className="select-container">
            <select onChange={(e) => handleAggregationTypeChange(e, queryState)} defaultValue="1">
              <option value="0">Average</option>
              <option value="1">Median</option>
              <option value="2">Sum</option>
            </select>
          </div>
        </div>
      </div>
      <button onClick={() => setExpanded(!expanded)}>
        <i className={classNameIcon}></i>
      </button>
    </div>
  );
}
