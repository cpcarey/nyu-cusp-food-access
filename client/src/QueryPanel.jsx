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

  function convertDateToString(date) {
    return date.toISOString().split('T')[0];
  }

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
  function handleSpatialAggregationTypeChange(e, queryState) {
    setQueryState({
      ...queryState,
      spatialAggregationType: parseInt(e.target.value),
    });
  }

  /**
   * @param {!Event} e
   * @param {!QueryState} queryState
   */
  function handleTemporalAggregationTypeChange(e, queryState) {
    setQueryState({
      ...queryState,
      temporalAggregationType: parseInt(e.target.value),
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
  function handleCompareDatesChange(e, queryState) {
    setQueryState({
      ...queryState,
      compareDates: e.target.checked,
    });
  }

  /**
   * @param {!Event} e
   * @param {!QueryState} queryState
   */
  function handleComparisonDateEndChange(e, queryState) {
    const {dateStart, dateEnd} =
        validateEndDate(
            new Date(queryState.comparisonDateStart),
            new Date(e.target.value));

    setQueryState({
      ...queryState,
      comparisonDateEnd: convertDateToString(dateEnd),
      comparisonDateStart: convertDateToString(dateStart),
    });
  }

  /**
   * @param {!Event} e
   * @param {!QueryState} queryState
   */
  function handleComparisonDateStartChange(e, queryState) {
    const {dateStart, dateEnd} =
        validateStartDate(
            new Date(e.target.value),
            new Date(queryState.comparisonDateEnd));

    setQueryState({
      ...queryState,
      comparisonDateEnd: convertDateToString(dateEnd),
      comparisonDateStart: convertDateToString(dateStart),
    });
  }

  /**
   * @param {!Event} e
   * @param {!QueryState} queryState
   */
  function handleDateEndChange(e, queryState) {
    console.log(queryState.dateStart, e.target.value);
    const {dateStart, dateEnd} =
        validateEndDate(
            new Date(queryState.dateStart),
            new Date(e.target.value));

    setQueryState({
      ...queryState,
      dateEnd: convertDateToString(dateEnd),
      dateStart: convertDateToString(dateStart),
    });
  }

  /**
   * @param {!Event} e
   * @param {!QueryState} queryState
   */
  function handleDateStartChange(e, queryState) {
    const {dateStart, dateEnd} =
        validateStartDate(
            new Date(e.target.value),
            new Date(queryState.dateEnd));

    setQueryState({
      ...queryState,
      dateEnd: convertDateToString(dateEnd),
      dateStart: convertDateToString(dateStart),
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

  function validateEndDate(dateStart, dateEnd) {
    // Ensure start date is at least seven days before end date.
    const dateStartMax = new Date(dateEnd);
    dateStartMax.setDate(dateEnd.getDate() - 7);

    if (dateStart > dateStartMax) {
      dateStart = dateStartMax;
    }

    return {dateStart, dateEnd};
  }

  function validateStartDate(dateStart, dateEnd) {
    // Ensure end date is at least seven days after end date.
    const dateEndMin = new Date(dateStart);
    dateEndMin.setDate(dateStart.getDate() + 7);

    if (dateEnd < dateEndMin) {
      dateEnd = dateEndMin;
    }

    return {dateStart, dateEnd};
  }

  return (
    <div className={classNamePanel}>
      <div className="panel-controls">
        <div className="panel-control dropdown">
          <div>Aggregation Direction</div>
          <div className="select-container">
            <select
              defaultValue={queryState.aggregationDirection}
              onChange={(e) => handleAggregationDirectionChange(e, queryState)}>
              <option value="0">POI CBG</option>
              <option value="1">Home CBG</option>
            </select>
          </div>
        </div>
        <hr />
        <div className="panel-control date-picker">
          <div>Start Date</div>
          <div>
            <input
              max="2021-03-01"
              min="2019-03-01"
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
              min="2019-03-02"
              onChange={(e) => handleDateEndChange(e, queryState)}
              type="date"
              value={queryState.dateEnd}
            />
          </div>
        </div>
        <div className="panel-control">
          <div>
            <span>Compare Dates</span>
            <input
              checked={queryState.compareDates}
              className="switch-checkbox"
              id="toggle-1"
              onChange={(e) => handleCompareDatesChange(e, queryState)}
              type="checkbox"
            />
            <label
              className="switch"
              htmlFor="toggle-1"
            ></label>
          </div>
        </div>
        {
          queryState.compareDates && (
              <div className="panel-control date-picker">
                <div>Comparison Start Date</div>
                <div>
                  <input
                    max="2021-03-01"
                    min="2019-03-01"
                    onChange={(e) => handleComparisonDateStartChange(e, queryState)}
                    type="date"
                    value={queryState.comparisonDateStart}
                  />
                </div>
              </div>
          )
        }
        {
          queryState.compareDates && (
              <div className="panel-control date-picker">
                <div>Comparison End Date</div>
                <div>
                  <input
                    max="2021-03-01"
                    min="2019-03-02"
                    onChange={(e) => handleComparisonDateEndChange(e, queryState)}
                    type="date"
                    value={queryState.comparisonDateEnd}
                  />
                </div>
              </div>
          )
        }
        <hr />
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
            <select
              defaultValue={queryState.attributeClass}
              onChange={(e) => handleAttributeClassChange(e, queryState)}>
              <option value="0">Supermarkets</option>
              <option value="1">General Stores</option>
              <option value="2">Restaurants</option>
              <option value="3">Community Food Services</option>
              <option value="4">Supplement Stores</option>
              <option value="5">Tobacco & Liquor Stores</option>
            </select>
          </div>
        </div>
        <hr />
        <div className="panel-control dropdown">
          <div>Metric</div>
          <div className="select-container">
            <select
              defaultValue={queryState.metricType}
              onChange={(e) => handleMetricTypeChange(e, queryState)}>
              <option value="0">Visitor count</option>
              <option value="1">High-density visitor count</option>
            </select>
          </div>
        </div>
        <div className="panel-control dropdown">
          <div>Spatial Aggregation</div>
          <div className="select-container">
            <select
              defaultValue={queryState.spatialAggregationType}
              onChange={(e) => handleSpatialAggregationTypeChange(e, queryState)}>
              <option value="0">Average</option>
              <option value="1">Median</option>
              <option value="2">Sum</option>
            </select>
          </div>
        </div>
        <div className="panel-control dropdown">
          <div>Temporal Aggregation</div>
          <div className="select-container">
            <select
              defaultValue={queryState.temporalAggregationType}
              onChange={(e) => handleTemporalAggregationTypeChange(e, queryState)}>
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
