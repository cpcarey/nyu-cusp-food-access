import cbgData from 'data/nyc_cbg_centroids.json';
import {Analysis} from 'analysis/Analysis';
import * as util from 'analysis/util';

/**
 * Draws the network of POI CBGs and home visitor CBGs weighted by number of
 * visits.
 */
export class NetworkAnalysis extends Analysis {
  /** @override */
  constructor(cbgIds, csvMap) {
    super(cbgIds, csvMap)

    this.id = 'cbgNetwork';

    this.cbgCoordMap = util.getCbgToCoordsMap(cbgData);
    this.cbgToCoordVisitsMap = this.getCbgToCoordVisitsMap_();
    this.cbgToVisitsFeaturesMap = this.getCbgToVisitsFeaturesMap_();
  }

  /**
   * Draws the analysis on the given map as a layer.
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
        features: [...this.cbgToVisitsFeaturesMap.values()]
            .reduce((a, b) => [...a, ...b]),
      },
    });

    map.addLayer({
      id: this.id,
      type: 'line',
      source: this.id,
      layout: {
        visibility: 'visible',
      },
      paint: {
        'line-color': '#fff',
        'line-opacity': ['get', 'opacity'],
        'line-width': ['get', 'width'],
      },
    },
    util.getFirstSymbolMapLayerId(map));

    super.applyToMap(map);
  }

  /**
   * Returns a LineString GeoJSON.Feature between the given CBG centroid
   * coordinate and the given CBG coordinate-visits pair visually weighted by
   * the visits value.
   * @param {[number, number]} cbgCoord
   * @param {coord: [number, number], value: number} coordVisit
   * @return {!GeoJSON.Feature}
   * @private
   */
  convertCoordVisitToLineFeature_(cbgCoord, coordVisit) {
    const ratio = Math.min(Math.max(coordVisit.value - 4, 0) / 20, 1);
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [cbgCoord, coordVisit.coord],
      },
      properties: {
        'opacity': ratio * 0.8,
        'width': ratio * 5,
      },
    };
  }

  /**
   * @return {!Map<string, {coord: [number, number], value: number}>}
   * @private
   */
  getCbgToCoordVisitsMap_() {
    const cbgToCoordVisitsMap = new Map();
    for (const [cbgId, visitsByCbg] of this.csvMap.entries()) {
      cbgToCoordVisitsMap.set(
          cbgId,
          visitsByCbg.map((visits, index) => {
            // TODO: Filter out self-visits?
            return {
              coord: this.cbgCoordMap.get(this.cbgIds[index]),
              value: visits,
            };
          })
          // XXX: cbgCoordMap should never return undefined.
          .filter(({coord}) => coord)
          .filter(({value}) => value));
    }
    return cbgToCoordVisitsMap;
  }

  /**
   * Returns a map from CBG ID to a list of GeoJSON features consisting of lines
   * between the centroids of CBGs and their corresponding visiting CBGs
   * visually weighted by the number of visits, i.e. lines between the POI CBG
   * and home CBG of each visitor.
   * @return {!Map<string, !Array<!GeoJSON.Feature>>}
   * @private
   */
  getCbgToVisitsFeaturesMap_() {
    const map = new Map();
    for (const [cbgId, visitCoords] of this.cbgToCoordVisitsMap.entries()) {
      const cbgCoord = this.cbgCoordMap.get(cbgId);
      map.set(
          cbgId,
          visitCoords.map((coordVisit) => {
            return this.convertCoordVisitToLineFeature_(cbgCoord, coordVisit);
          }));
    }
    return map;
  }
}
