import cbgData from 'data/nyc_cbgs.json';
import {Analysis} from 'analysis/Analysis';
import * as util from 'analysis/util';

export class VisitChoroplethAnalysis extends Analysis {
  /**
   * @param {string} color Choropleth color
   * @param {string} id Analysis ID to use within Mapbox
   * @override
   */
  constructor(cbgValueMap, threshold=100, colorMax='#ff2200', colorMin='#00adff', id='cbg1') {
    super(cbgValueMap);

    this.colorMin = colorMin;
    this.colorMax = colorMax;

    this.threshold = threshold;
    this.id = id;

    this.cbgNormalizedValueMap = util.normalizeSigmaMap(cbgValueMap, 4.0);

    this.cbgToPolygonsMap = util.getCbgToCoordsMap(cbgData);
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
        'fill-color': ['get', 'color'],
        'fill-opacity': ['get', 'opacity'],
      },
    },
    util.getFirstSymbolMapLayerId(map));

    super.applyToMap(map);
  }

  convertCoordVisitToMultiPolygonFeature_(cbgId) {
    const ratio =
        this.cbgNormalizedValueMap.has(cbgId)
            ? (this.cbgNormalizedValueMap.get(cbgId) - 0.5) * 2
            : 0;
    return {
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: this.cbgToPolygonsMap.get(cbgId),
      },
      properties: {
        'color': ratio > 0 ? this.colorMax : this.colorMin,
        'opacity': Math.abs(ratio),
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
}
