import {useCallback, useEffect, useState} from 'react';
import Plot from 'react-plotly.js';

import './ChartPanel.css';
import './Panel.css';

import censusJson from './data/cbg_attr_and_cluster_1115.json';
const incomeJson = censusJson['income'];
const clusterJson = censusJson['cluster'];

const N_PERCENTILES = 20;
const PERCENTILE_INDICES = new Array(N_PERCENTILES).fill(0).map((x, i) => i);

// Ordered by income.
const CLUSTER_ORDER = [2, 3, 0, 1];

const SIGMA_MIN = -2;
const SIGMA_MAX = 2;

const COLORS = [
  '#e41a1b',
  '#377eb8',
  '#4eaf4a',
  '#984ea4',
];

export function ChartPanel({dataState, hoverState}) {
  const [clusterLines, setClusterLines] = useState([]);
  const [clusterValues, setClusterValues] = useState([]);
  const [expanded, setExpanded] = useState(true);

  const [hoveredPercentileIndex, setHoveredPercentileIndex] = useState(null);
  const [hoveredPercentileValue, setHoveredPercentileValue] = useState(null);

  const [hoveredCluster, setHoveredCluster] = useState(0);

  const [hoveredStdValue, setHoveredStdValue] = useState(0);
  const [hoveredValue, setHoveredValue] = useState('');
  const [values, setValues] = useState([]);

  const [incomePercentileThresholds, setIncomePercentileThresholds] = useState([]);
  const [percentileValues, setPercentileValues] = useState([]);

  const classNamePanel = [
    'panel',
    'panel-right',
    'chart-panel',
    expanded ? 'expanded' : '',
  ].filter((className) => className.length).join(' ');

  const classNameIcon = 'far fa-chart-bar';

  const getIncomePercentileIndex =
      useCallback(function(income) {
        if (!income) {
          return 0;
        }

        for (let i = 0; i < N_PERCENTILES; i++) {
          if (i === N_PERCENTILES - 1 ||
              (income > incomePercentileThresholds[i] &&
               income <= incomePercentileThresholds[i + 1])) {
            return i;
          }
        }
      }, [incomePercentileThresholds]);

  // Set hovered CBG value.
  useEffect(() => {
    if (hoverState.cbg === null) {
      setHoveredValue('');
    } else if (hoverState.cbg.value <= 1) {
      setHoveredValue(hoverState.cbg.value.toFixed(4));
    } else if (hoverState.cbg.value <= 10) {
      setHoveredValue(hoverState.cbg.value.toFixed(3));
    } else {
      setHoveredValue(hoverState.cbg.value.toFixed(2));
    }
  }, [hoverState, setHoveredValue]);

  // Set hovered CBG cluster.
  useEffect(() => {
    const lines = {
      color: '#fff',
      width: new Array(4).fill(0),
    };
    if (hoverState.cbg === null || hoverState.cbg.id === null || clusterJson[hoverState.cbg.id] === null) {
      setHoveredCluster(null);
      setClusterLines(lines);
      return;
    }

    const hoveredCluster = clusterJson[hoverState.cbg.id];
    lines.width[hoveredCluster] = 2;

    setHoveredCluster(hoveredCluster);
    setClusterLines(lines);
  }, [hoverState, setClusterLines, setHoveredCluster]);

  // Set hovered CBG in percentile plot.
  useEffect(() => {
    if (hoverState.cbg === null) {
      setHoveredPercentileIndex(null);
      setHoveredPercentileValue(null);
    } else {
      const key = hoverState.cbg.id;
      const x = incomeJson[key];
      const y = dataState.cbgValueMap.get(key);
      if (x === null || y === null) {
        setHoveredPercentileIndex(null);
        setHoveredPercentileValue(null);
        return;
      }

      const percentileIndex = getIncomePercentileIndex(incomeJson[key]);
      setHoveredPercentileIndex(percentileIndex);
      setHoveredPercentileValue(percentileValues[percentileIndex]);
    }
  }, [
    dataState, getIncomePercentileIndex, hoverState, percentileValues,
    setHoveredPercentileIndex, setHoveredPercentileValue,
  ]);

  // Set hovered CBG in distribution plot.
  useEffect(() => {
    if (hoverState.cbg === null) {
      setHoveredStdValue(0);
    } else {
      const cbgId = hoverState.cbg.id;
      const stdValue = dataState.cbgStandardizedValueMap.get(cbgId);
      setHoveredStdValue(
          Math.min(Math.max(stdValue || 0, SIGMA_MIN), SIGMA_MAX));
    }
  }, [dataState, hoverState, setHoveredStdValue]);

  useEffect(() => {
    const incomes = Object.values(incomeJson).filter((a) => a);
    incomes.sort((a, b) => a - b);

    const incomePercentileThresholds = [];
    const k = 20;
    const q = Math.floor(incomes.length / k);
    for (let i = 0; i < k; i++) {
      incomePercentileThresholds.push(incomes[(i + 1) * q]);
    }

    setIncomePercentileThresholds(incomePercentileThresholds);
  }, [setIncomePercentileThresholds]);

  // Set values.
  useEffect(() => {
    const cbgs = [...dataState.cbgStandardizedValueMap.keys()];
    setValues([...dataState.cbgStandardizedValueMap.values()]);

    const incomeCbgs = [];
    const incomes = [];
    const incomeValues = [];

    const clusterSums = [0, 0, 0, 0, 0, 0];
    const clusterCounts = [0, 0, 0, 0, 0, 0];

    for (const cbg of cbgs) {
      const x = incomeJson[cbg];
      const y = dataState.cbgStandardizedValueMap.get(cbg);
      const t = cbg;

      if (x && y) {
        incomeCbgs.push(t);
        incomes.push(x);
        incomeValues.push(y);
      }

      const value = dataState.cbgStandardizedValueMap.get(cbg) || 0;
      const clusterIndex = clusterJson[cbg];
      clusterSums[clusterIndex] += value;
      clusterCounts[clusterIndex]++;
    }

    const percentileValues = [];

    incomes.sort((a, b) => a - b);
    for (let i = 0; i < N_PERCENTILES; i++) {
      percentileValues.push([]);
    }

    for (let i in incomes) {
      percentileValues[getIncomePercentileIndex(incomes[i])].push(incomeValues[i]);
    }
    for (let i in percentileValues) {
      percentileValues[i] =
          percentileValues[i].reduce((a, b) => a + b, 0) / percentileValues[i].length;
    }

    const clusterMeans =
        clusterSums
            .map((sum, i) => sum / clusterCounts[i])
            .filter((x, i) => i !== 4);

    setPercentileValues(percentileValues);
    setClusterValues(clusterMeans);
  }, [
    dataState, getIncomePercentileIndex, setClusterValues,
    setPercentileValues, setValues,
  ]);

  return (
    <div className={classNamePanel}>
      <div className="panel-content">
        <div className="value-row">
          <strong>CBG:</strong>
          <span>{hoverState.cbg?.id}</span>
        </div>
        <div className="value-row">
          <strong>Value:</strong>
          <span>{hoveredValue}</span>
        </div>
        <div className="value-row">
          <strong>Income:</strong>
          <span>{
            hoveredPercentileValue
                ? hoveredPercentileValue.toLocaleString()
                : 'N/A'
          }</span>
        </div>

        <div className="plot-container">
          <div className="plot-title">Value Histogram</div>
          <div className="plot-double">
            <Plot
              data={[
                {
                  hoverinfo: 'skip',
                  type: 'histogram',
                  x: values,
                  marker: {
                    color: '#ff2200',
                  },
                },
              ]}
              layout={{
                height: 98,
                hoverinfo: 'skip',
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
                      color: '#fff',
                      width: 0.8,
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

            <Plot
              data={[
                {
                  hoverinfo: 'skip',
                  type: 'histogram',
                  x: values,
                  marker: {
                    color: '#00adff',
                  },
                },
              ]}
              layout={{
                height: 98,
                hoverinfo: 'skip',
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
                      color: '#fff',
                      width: 0.8,
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

          <div className="plot-title">By Income Percentile (Mean)</div>
          <Plot
            data={[
              {
                type: 'scatter',
                mode: 'markers',
                x: PERCENTILE_INDICES,
                y: percentileValues,
                text: PERCENTILE_INDICES,
                marker: {
                  color: percentileValues.map((x) => x < 0 ? '#00adff' : '#ff2200'),
                  size: 5,
                  opacity: 1,
                },
              },
            ]}
            layout={{
              height: 196,
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
                  type: 'circle',
                  xanchor: hoveredPercentileIndex,
                  yanchor: hoveredPercentileValue,
                  opacity: hoveredPercentileIndex === null ? 0 : 1,
                  x0: -6,
                  x1: 6,
                  y0: -6,
                  y1: 6,
                  xref: 'x',
                  yref: 'y',
                  xsizemode: 'pixel',
                  ysizemode: 'pixel',
                  fillcolor: '#fff',
                },
              ],
              xaxis: {
                gridcolor: 'transparent',
                zerolinecolor: '#999',
              },
              yaxis: {
                gridcolor: 'transparent',
                zerolinecolor: '#999',
              },
            }}
          />

          <div className="plot-title">By Cluster (Mean)</div>
          <Plot
            data={[
              {
                type: 'bar',
                marker: {
                  color: [
                    COLORS[CLUSTER_ORDER[0]],
                    COLORS[CLUSTER_ORDER[1]],
                    COLORS[CLUSTER_ORDER[2]],
                    COLORS[CLUSTER_ORDER[3]],
                  ],
                  line: clusterLines,
                },
                x: CLUSTER_ORDER,
                y: [
                  clusterValues[CLUSTER_ORDER[0]],
                  clusterValues[CLUSTER_ORDER[1]],
                  clusterValues[CLUSTER_ORDER[2]],
                  clusterValues[CLUSTER_ORDER[3]],
                ],
              },
            ]}
            layout={{
              height: 98,
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
              xaxis: {
                gridcolor: 'transparent',
                zerolinecolor: 'transparent',
              },
              yaxis: {
                gridcolor: 'transparent',
                zerolinecolor: '#999',
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
