import {useEffect, useState} from 'react';
import Plot from 'react-plotly.js';

import './ChartPanel.css';
import './Panel.css';

const SIGMA_MIN = -2;
const SIGMA_MAX = 2;

export function ChartPanel({dataState, mapState}) {
  const [expanded, setExpanded] = useState(true);
  const [hoveredStdValue, setHoveredStdValue] = useState(0);
  const [hoveredValue, setHoveredValue] = useState('');
  const [values, setValues] = useState([]);

  const classNamePanel = [
    'panel',
    'panel-right',
    'chart-panel',
    expanded ? 'expanded' : '',
  ].filter((className) => className.length).join(' ');

  const classNameIcon = 'far fa-chart-bar';

  // Set hovered CBG value.
  useEffect(() => {
    if (mapState.hoveredCbg === null) {
      setHoveredValue('');
    } else if (mapState.hoveredCbg.value <= 1) {
      setHoveredValue(mapState.hoveredCbg.value.toFixed(4));
    } else if (mapState.hoveredCbg.value <= 10) {
      setHoveredValue(mapState.hoveredCbg.value.toFixed(3));
    } else {
      setHoveredValue(mapState.hoveredCbg.value.toFixed(2));
    }
  }, [mapState, setHoveredValue]);


  useEffect(() => {
    if (mapState.hoveredCbg === null) {
      setHoveredStdValue(0);
    } else {
      const cbgId = mapState.hoveredCbg.id;
      const stdValue = dataState.cbgStandardizedValueMap.get(cbgId);
      setHoveredStdValue(Math.min(Math.max(stdValue || 0, SIGMA_MIN), SIGMA_MAX));
    }
  }, [dataState, mapState, setHoveredStdValue]);

  // Set values.
  useEffect(() => {
    setValues([...dataState.cbgStandardizedValueMap.values()]);
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
          <span>{hoveredValue}</span>
        </div>

        <div className="plot-container">
          <Plot
            data={[
              {
                type: 'histogram',
                x: values,
                marker: {
                  color: '#8900e1',
                },
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
              shapes: [
                {
                  type: 'line',
                  x0: 0,
                  x1: 0,
                  y0: 0,
                  y1: 1,
                  yref: 'paper',
                  line: {
                    color: '#999',
                    width: 0.5,
                  },
                },
                {
                  type: 'line',
                  x0: hoveredStdValue,
                  x1: hoveredStdValue,
                  y0: 0,
                  y1: 1,
                  yref: 'paper',
                  line: {
                    color: '#fff',
                    width: 1,
                  },
                },
              ],
              xaxis: {
                range: [-3, 3],
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
