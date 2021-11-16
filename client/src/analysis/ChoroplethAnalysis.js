import {ColorAnalysis} from './ColorAnalysis.js';

import censusJson from '../data/cbg_attr_and_cluster_1115.json';
const populationJson = censusJson['population'];

const DEFAULT_COLOR_MAX = '#ff2200';
const DEFAULT_COLOR_MIN = '#00adff';
const DEFAULT_ID = 'cbg1';

export class ChoroplethAnalysis extends ColorAnalysis {
  /**
   * @param {!Map<string, number>} cbgValueMap
   * @param {function({id: number, value: number}):void} setHoveredCbg
   * @param {!string} colorMax
   * @param {!string} colorMin
   * @param {string} id Analysis ID to use within Mapbox
   * @override
   */
  constructor(
      cbgValueMap, setHoveredCbg, colorMax=DEFAULT_COLOR_MAX,
      colorMin=DEFAULT_COLOR_MIN, id=DEFAULT_ID) {
    super(
        cbgValueMap, setHoveredCbg,
        (cbgId, valueMap) => getColor(cbgId, valueMap, colorMax, colorMin),
        getLineWidth, getOpacity, hasData, id);
  }
}

function getColor(cbgId, valueMap, colorMax, colorMin) {
  return getRatio(cbgId, valueMap) > 0 ? colorMax : colorMin;
}

function getLineWidth(cbgId, valueMap) {
  return hasData(cbgId, valueMap) ? 2 : 0;
}

function getOpacity(cbgId, valueMap) {
  return hasData(cbgId, valueMap)
      ? Math.abs(getRatio(cbgId, valueMap)) * 0.55 + 0.15
      : 0;
}

function getRatio(cbgId, valueMap) {
  return valueMap.has(cbgId)
      ? (valueMap.get(cbgId) - 0.5) * 2
      : 0;
}

function hasData(cbgId, valueMap) {
  return valueMap.has(cbgId) && populationJson[cbgId] !== undefined
      && populationJson[cbgId] > 10;
}
