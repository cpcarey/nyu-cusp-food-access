import {useState} from 'react';

import './ChartPanel.css';
import './Panel.css';

export function ChartPanel({mapState}) {
  const [expanded, setExpanded] = useState(false);

  const classNamePanel = [
    'panel',
    'panel-right',
    'chart-panel',
    expanded ? 'expanded' : '',
  ].filter((className) => className.length).join(' ');
  const classNameIcon = 'far fa-chart-bar';

  /** @return {string} */
  function getValue() {
    if (mapState.hoveredCbg === null) {
      return '';
    }
    if (mapState.hoveredCbg.value <= 1) {
      return mapState.hoveredCbg.value.toFixed(4);
    }
    if (mapState.hoveredCbg.value <= 10) {
      return mapState.hoveredCbg.value.toFixed(3);
    }
    return mapState.hoveredCbg.value.toFixed(2);
  }

  return (
    <div className={classNamePanel}>
      <div className="panel-content">
        <div className="value-row">
          <strong>CBG:</strong>
          <span>{mapState.hoveredCbg?.id}</span>
        </div>
        <div className="value-row">
          <strong>Value:</strong>
          <span>{getValue()}</span>
        </div>
      </div>
      <button onClick={() => setExpanded(!expanded)}>
        <i className={classNameIcon}></i>
      </button>
    </div>
  );
}
