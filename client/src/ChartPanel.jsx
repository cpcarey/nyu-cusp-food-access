import {useEffect, useState} from 'react';
import Plot from 'react-plotly.js';

import './ChartPanel.css';
import './Panel.css';

export function ChartPanel({dataState, mapState}) {
  const [expanded, setExpanded] = useState(true);
  const [values, setValues] = useState([]);

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

  useEffect(() => {
    setValues([...dataState.cbgNormalizedValueMap.values()]);
  }, [dataState, setValues]);

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

        <div className="plot-container">
          <Plot
            data={[
              {
                x: values,
                type: 'histogram',
              },
            ]}
            layout={{
              height: 80,
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              width: 196,
              margin: {
                b: 0,
                l: 0,
                pad: 0,
                r: 0,
                t: 0,
              },
              yaxis: {
                gridcolor: 'transparent',
              },
            }}
          />
        </div>
      </div>
      <button onClick={() => setExpanded(!expanded)}>
        <i className={classNameIcon}></i>
      </button>
    </div>
  );
}
