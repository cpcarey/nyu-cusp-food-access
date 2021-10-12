import cbgData from 'data/nyc_cbgs.json';
import {Analysis} from 'analysis/Analysis';
import * as util from 'analysis/util';

const DEFAULT_ID = 'cbg1';

export class ColorAnalysis extends Analysis {
  /**
   * @param {!Map<string, number>} cbgValueMap
   * @param {function({id: number, value: number}):void} setHoveredCbg
   * @param {function(number):number} getColor Function which returns a polygon
   *     color for a given CBG ID
   * @param {function(number):number} getLineWidth Function which returns a
   *     polygon line width for a given CBG ID
   * @param {function(number):boolean} getLineWidth Function which returns
   *     whether the given CBG ID has data
   * @param {string} id Analysis ID to use within Mapbox
   * @override
   */
  constructor(
      cbgValueMap, setHoveredCbg, getColor, getLineWidth, getOpacity, hasData,
      id=DEFAULT_ID) {
    super(cbgValueMap);

    /** @type {string} */
    this.id = id;

    this.getColor = getColor;
    this.getLineWidth = getLineWidth;
    this.getOpacity = getOpacity;
    this.hasData = hasData;

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
      map.getCanvas().style.cursor =
          (hover && id && this.hasData(id, this.cbgNormalizedValueMap))
              ? 'pointer'
              : 'grab';
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

  /**
   * @param {string} cbgId
   * @return {!GeoJson.Feature}
   * @private
   */
  convertCoordVisitToMultiPolygonFeature_(cbgId) {
    return {
      id: cbgId,
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: this.cbgIdToPolygonsMap.get(cbgId),
      },
      properties: {
        'color': this.getColor(cbgId, this.cbgNormalizedValueMap),
        'lineWidth': this.getLineWidth(cbgId, this.cbgNormalizedValueMap),
        'opacity': this.getOpacity(cbgId, this.cbgNormalizedValueMap),
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
