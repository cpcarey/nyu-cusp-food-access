import {ColorAnalysis} from './ColorAnalysis.js';

import censusJson from '../data/cbg_attr_and_cluster_1115.json';
const populationJson = censusJson['population'];
const clusterJson = censusJson['cluster'];

const DEFAULT_ID = 'cbg1';

const COLORS = [
  '#e41a1b',
  '#377eb8',
  '#4eaf4a',
  '#984ea4',
  '#ff7f00',
  '#ffff33',
];

export class ClusterAnalysis extends ColorAnalysis {
  /**
   * @param {!Map<string, number>} cbgValueMap
   * @param {function({id: number, value: number}):void} setHoveredCbg
   * @param {!string} colorMax
   * @param {!string} colorMin
   * @param {string} id Analysis ID to use within Mapbox
   * @override
   */
  constructor(
      cbgValueMap, setHoveredCbg, id=DEFAULT_ID) {
    super(
        cbgValueMap, setHoveredCbg,
        (cbgId, valueMap) => getColor(cbgId, valueMap),
        getLineWidth, getOpacity, hasData, id);
  }
}

function getColor(cbgId, valueMap) {
  return hasData(cbgId) ? COLORS[clusterJson[cbgId]] : 'transparent';
}

function getLineWidth(cbgId, valueMap) {
  return hasData(cbgId, valueMap) ? 2 : 0;
}

function getOpacity(cbgId, valueMap) {
  return hasData(cbgId, valueMap) ? 0.5 : 0;
}

function hasData(cbgId, valueMap) {
  return clusterJson[cbgId] !== undefined && populationJson[cbgId] !== undefined
      && populationJson[cbgId] > 10;
}
