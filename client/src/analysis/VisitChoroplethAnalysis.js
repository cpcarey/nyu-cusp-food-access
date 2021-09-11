import cbgData from 'data/nyc_cbgs.json';
import {Analysis} from 'analysis/Analysis';
import * as util from 'analysis/util';

const DEFAULT_COLOR_MAX = '#ff2200';
const DEFAULT_COLOR_MIN = '#00adff';
const DEFAULT_ID = 'cbg1';

export class VisitChoroplethAnalysis extends Analysis {
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
    super(cbgValueMap);

    /** @type {string} */
    this.colorMax = colorMax;

    /** @type {string} */
    this.colorMin = colorMin;

    /** @type {string} */
    this.id = id;

    /** @type {string} */
    this.cbgFillLayerId = `${this.id}-fill`;

    /** @type {!Map<string, !GeoJSON.Feature>} */
    this.cbgIdToFeatureMap = new Map();

    /** @type {!Map<string, [number, number]>} */
    this.cbgIdToPolygonsMap = new Map();

    /** @type {string} */
    this.cbgLineLayerId = `${this.id}-line`;

    /** @type {!Map<string, number>} */
    this.cbgNormalizedValueMap = new Map();

    /** @type {?string} */
    this.hoveredCbgId = null;

    /** @type {function({id: number, value: number}):void} */
    this.setHoveredCbg = setHoveredCbg;

    this.setCbgValueMap(cbgValueMap);
  }

  /**
   * Draws the network analysis on the given map as a layer.
   * @param {!mapboxgl.Map} map
   */
  applyToMap(map) {
    if (this.map) {
      return;
    }

    let source = map.getSource(this.id);
    if (!source) {
      map.addSource(this.id, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });
      source = map.getSource(this.id);
    }

    source.setData({
      type: 'FeatureCollection',
      features: [...this.cbgIdToFeatureMap.values()],
    });

    function resetLayer(id) {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
    }

    resetLayer(this.cbgFillLayerId);
    resetLayer(this.cbgLineLayerId);

    map.addLayer({
      id: this.cbgFillLayerId,
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

    map.addLayer({
      id: this.cbgLineLayerId,
      type: 'line',
      source: this.id,
      layout: {
        visibility: 'visible',
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          1,
          0,
        ],
        'line-width': ['get', 'lineWidth'],
      },
    },
    this.cbgFillLayerId);

    const setHoveredState = (id, hover) => {
      if (id) {
        map.setFeatureState({id, source: this.id}, {hover});
        if (hover && this.cbgValueMap.has(id)) {
          this.setHoveredCbg({id, value: this.cbgValueMap.get(id)});
        }
      }
      map.getCanvas().style.cursor = (hover && id && this.getRatio_(id)) ? 'pointer' : 'grab';
    }

    map.on('mousemove', this.cbgFillLayerId, (e) => {
      if (e.features.length) {
        setHoveredState(this.hoveredCbgId, false);
        this.hoveredCbgId = e.features[0].id;
        setHoveredState(this.hoveredCbgId, true);
      } else {
        map.getCanvas().style.cursor = 'grab';
      }
    });

    map.on('mouseleave', this.cbgFillLayerId, (e) => {
      setHoveredState(this.hoveredCbgId, false);
      this.hoveredCbgId = null;
    });

    super.applyToMap(map);
  }

  /** @param {!Map<string, number> cbgValueMap */
  setCbgValueMap(cbgValueMap) {
    this.cbgValueMap = cbgValueMap;
    this.cbgNormalizedValueMap = util.normalizeSigmaMap(cbgValueMap, 4.0);
    this.cbgIdToPolygonsMap = util.getCbgIdToCoordsMap(cbgData);
    this.cbgIdToFeatureMap = this.getCbgIdToFeatureMap_();
    if (this.map) {
      this.map.getSource(this.id).setData({
        type: 'FeatureCollection',
        features: [...this.cbgIdToFeatureMap.values()],
      });
    }
  }

  getRatio_(cbgId) {
    return this.cbgNormalizedValueMap.has(cbgId)
            ? (this.cbgNormalizedValueMap.get(cbgId) - 0.5) * 2
            : 0;
  }

  /**
   * @param {string} cbgId
   * @return {!GeoJson.Feature}
   * @private
   */
  convertCoordVisitToMultiPolygonFeature_(cbgId) {
    const ratio = this.getRatio_(cbgId);
    return {
      id: cbgId,
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: this.cbgIdToPolygonsMap.get(cbgId),
      },
      properties: {
        'color': ratio > 0 ? this.colorMax : this.colorMin,
        'lineWidth': ratio ? 2 : 0,
        'opacity': Math.abs(ratio) * 0.75,
      },
    };
  }

  /**
   * @param {string} cbgId
   * @return {!Map<string, !GeoJSON.Feature>}
   * @private
   */
  getCbgIdToFeatureMap_() {
    const cbgIdToFeatureMap = new Map();
    for (const cbgId of this.cbgIdToPolygonsMap.keys()) {
      cbgIdToFeatureMap.set(
          cbgId, this.convertCoordVisitToMultiPolygonFeature_(cbgId));
    }
    return cbgIdToFeatureMap;
  }
}
