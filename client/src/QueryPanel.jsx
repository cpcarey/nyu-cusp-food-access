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
  function handleCompareAttributeClassesChange(e, queryState) {
    setQueryState({
      ...queryState,
      compareAttributeClasses: e.target.checked,
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
  function handleComparisonAttributeClassChange(e, queryState) {
    setQueryState({
      ...queryState,
      comparisonAttributeClass: parseInt(e.target.value),
    });
  }

  /**
   * @param {!Event} e
   * @param {!QueryState} queryState
   */
  function handleComparisonDateStartChange(e, queryState) {
    const dateStart = new Date(e.target.value);

    setQueryState({
      ...queryState,
      comparisonDateStart: convertDateToString(dateStart),
    });
  }

  /**
   * @param {!Event} e
   * @param {!QueryState} queryState
   */
  function handleDatePeriodDurationChange(e, queryState) {
    setQueryState({
      ...queryState,
      datePeriodDuration: parseInt(e.target.value),
    });
  }

  /**
   * @param {!Event} e
   * @param {!QueryState} queryState
   */
  function handleDateStartChange(e, queryState) {
    const primary = {};
    const compare = {};
    const {datePeriodDuration} = queryState;

    primary.dateStart = getMonday(new Date(e.target.value));

    primary.dateEnd = new Date(primary.dateStart);
    primary.dateEnd.setDate(primary.dateStart.getDate() + 7 * datePeriodDuration - 1);
    primary.dateEnd = getMonday(primary.dateEnd);

    compare.dateStart = new Date(primary.dateStart);
    compare.dateStart.setDate(compare.dateStart.getDate() - 7 * datePeriodDuration);
    compare.dateStart = getMonday(compare.dateStart);

    compare.dateEnd = new Date(compare.dateStart);
    compare.dateEnd.setDate(compare.dateStart.getDate() + 7 * datePeriodDuration - 1);
    compare.dateEnd = getMonday(compare.dateEnd);

    setQueryState({
      ...queryState,
      dateEnd: convertDateToString(primary.dateEnd),
      dateStart: convertDateToString(primary.dateStart),
      comparisonDateEnd: convertDateToString(compare.dateEnd),
      comparisonDateStart: convertDateToString(compare.dateStart),
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

  function getMonday(date) {
    while (date.getDay() !== 1) {
      date.setDate(date.getDate() - 1)
    }
    return date;
  }

  function getEndDateOption(queryState, weeks) {
    const date = new Date(queryState.dateStart);
    date.setDate(date.getDate() + weeks * 7 - 1);
    return date;
  }

  function getEndDateOptionString(queryState, weeks) {
    //const date = getEndDateOption(queryState, weeks);
    const date = new Date(queryState.dateStart);
    date.setDate(date.getDate() + weeks * 7 - 1);
    return `${weeks} weeks (${date.toLocaleDateString()})`;
  }

  return (
    <div className={classNamePanel}>
      <div className="panel-controls">
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
        <div className="panel-control">
          <div>End Date</div>
          <div className="select-container">
            <select
              defaultValue={queryState.datePeriodDuration}
              onChange={(e) => handleDatePeriodDurationChange(e, queryState)}>
              <option value="3">
                {getEndDateOptionString(queryState, 3)}
              </option>
              <option value="6">
                {getEndDateOptionString(queryState, 6)}
              </option>
              <option value="12">
                {getEndDateOptionString(queryState, 12)}
              </option>
              <option value="24">
                {getEndDateOptionString(queryState, 24)}
              </option>
            </select>
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
              <div className="panel-control">
                <div>Comparison End Date</div>
                <div className="select-container">
                  <select>
                    defaultValue={queryState.datePeriodDuration}
                    onChange={(e) => handleDatePeriodDurationChange(e, queryState)}>
                    <option value="1">
                      {getEndDateOptionString(queryState, 1)}
                    </option>
                    <option value="3">
                      {getEndDateOptionString(queryState, 3)}
                    </option>
                    <option value="6">
                      {getEndDateOptionString(queryState, 6)}
                    </option>
                    <option value="12">
                      {getEndDateOptionString(queryState, 12)}
                    </option>
                    <option value="24">
                      {getEndDateOptionString(queryState, 24)}
                    </option>
                  </select>
                </div>
              </div>
          )
        }
        <hr />
        <div className="panel-control dropdown">
          <div>Attribute</div>
          <div className="select-container">
            <select>
              <option value="0">POI Category</option>
            </select>
          </div>
        </div>
        <div className="panel-control dropdown">
          <div>Attribute Class</div>
          <div className="select-container">
            <select
              defaultValue={queryState.attributeClass}
              onChange={(e) => handleAttributeClassChange(e, queryState)}>
              <option value="0">Beer, Wine, and Liquor Stores</option>
              <option value="1">Big Box Grocers</option>
              <option value="2">Delis and Convenience Stores</option>
              <option value="3">Drinking Places</option>
              <option value="4">Fast-Food Restaurants</option>
              <option value="5">Food Services</option>
              <option value="6">Full-Service Restaurants</option>
              <option value="7">General Merchandise Stores</option>
              <option value="8">Limited-Service Restaurants</option>
              <option value="9">Pharmacies and Drug Stores</option>
              <option value="10">Snacks and Bakeries</option>
              <option value="11">Specialty Food Stores</option>
              <option value="12">Supermarkets</option>
              <option value="13">Tobacco Stores</option>
            </select>
          </div>
        </div>
        <div className="panel-control">
          <div>
            <span>Compare Classes</span>
            <input
              checked={queryState.compareAttributeClasses}
              className="switch-checkbox"
              id="toggle-2"
              onChange={(e) => handleCompareAttributeClassesChange(e, queryState)}
              type="checkbox"
            />
            <label
              className="switch"
              htmlFor="toggle-2"
            ></label>
          </div>
        </div>
        {
          queryState.compareAttributeClasses && (
              <div className="panel-control dropdown">
                <div>Comparison Attr. Class</div>
                <div className="select-container">
                  <select
                    defaultValue={queryState.comparisonAttributeClass}
                    onChange={(e) => handleComparisonAttributeClassChange(e, queryState)}>
                    <option value="0">Supermarkets</option>
                    <option value="1">General Stores</option>
                    <option value="2">Restaurants</option>
                    <option value="3">Community Food Services</option>
                    <option value="4">Supplement Stores</option>
                    <option value="5">Tobacco & Liquor Stores</option>
                  </select>
                </div>
              </div>
          )
        }
        <hr />
        <div className="panel-control dropdown">
          <div>Metric</div>
          <div className="select-container">
            <select
              defaultValue={queryState.metricType}
              onChange={(e) => handleMetricTypeChange(e, queryState)}>
              <option value="0">Est. visitor count</option>
              <option value="1">% est. visitor count</option>
              <option value="2">Contact density index</option>
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
