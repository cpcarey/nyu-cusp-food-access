import cbgData from 'data/nyc_cbgs.json';
import {Analysis} from 'analysis/Analysis';
import * as util from 'analysis/util';

export class VisitChoroplethAnalysis extends Analysis {
  /**
   * @param {string} Choropleth color
   * @oaram {string} Analysis ID to use within Mapbox
   * @override
   */
  constructor(cbgIds, csvMap, threshold=100, color='#b654f8', id='cbg1') {
    super(cbgIds, csvMap);

    this.color = color;
    this.threshold = threshold;
    this.id = id;

    this.cbgToPolygonsMap = util.getCbgToCoordsMap(cbgData);
    this.cbgToVisitsMap = this.getCbgToVisitsMap_();
    this.cbgToFeatureMap = this.getCbgToFeatureMap_();
  }

  /**
   * Draws the network analysis on the given map as a layer.
   * @param {!mapboxgl.Map} map
   */
  applyToMap(map) {
    if (this.map) {
      return;
    }

    map.addSource(this.id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [...this.cbgToFeatureMap.values()],
      },
    });

    map.addLayer({
      id: this.id,
      type: 'fill',
      source: this.id,
      layout: {
        visibility: 'visible',
      },
      paint: {
        'fill-color': this.color,
        'fill-opacity': ['get', 'opacity'],
      },
    },
    util.getFirstSymbolMapLayerId(map));

    super.applyToMap(map);
  }

  convertCoordVisitToMultiPolygonFeature_(cbgId) {
    const ratio = Math.min((this.cbgToVisitsMap.get(cbgId) || 0) / this.threshold, 1);
    return {
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: this.cbgToPolygonsMap.get(cbgId),
      },
      properties: {
        'opacity': ratio * 0.4,
      },
    };
  }

  getCbgToFeatureMap_() {
    const cbgToFeatureMap = new Map();
    for (const cbgId of this.cbgToPolygonsMap.keys()) {
      cbgToFeatureMap.set(
          cbgId, this.convertCoordVisitToMultiPolygonFeature_(cbgId));
    }
    return cbgToFeatureMap;
  }

  /**
   * @return {!Map<string, {coord: [number, number], value: number}>}
   * @private
   */
  getCbgToVisitsMap_() {
    const cbgToCoordVisitsMap = new Map();
    for (const [cbgId, visitsByCbg] of this.csvMap.entries()) {
      cbgToCoordVisitsMap.set(cbgId, visitsByCbg.reduce((a, b) => a + b));
    }
    return cbgToCoordVisitsMap;
  }
}
