import cbgData from 'data/nyc_cbg_centroids.json';

/**
 * Draws the network of POI CBGs and home visitor CBGs weighted by number of
 * visits.
 */
export class NetworkAnalysis {
  /**
   * @param {!Array<string>} cbgIds
   * @param {!Map<string, !Array<number>} csvMap Map of CBG ID to array of
   *   visits per CBG from adjacency matrix CSV.
   */
  constructor(cbgIds, csvMap) {
    this.cbgIds = cbgIds;
    this.csvMap = csvMap;

    this.cbgCoordMap = getCbgToCoordMap();
    this.cbgToCoordVisitsMap = this.getCbgToCoordVisitsMap_();
    this.cbgToVisitsFeaturesMap = this.getCbgToVisitsFeaturesMap_();
  }

  /**
   * Draws the network analysis on the given map as a layer.
   * @param {!mapboxgl.Map} map
   */
  applyToMap(map) {
    map.addSource('cbgNetwork', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [...this.cbgToVisitsFeaturesMap.values()]
            .reduce((a, b) => [...a, ...b]),
      },
    });

    map.addLayer({
      id: 'cbgNetwork',
      type: 'line',
      source: 'cbgNetwork',
      layout: {
        visibility: 'visible',
      },
      paint: {
        'line-color': '#fff',
        'line-opacity': ['get', 'opacity'],
        'line-width': ['get', 'width'],
      },
    },
    getFirstSymbolMapLayerId(map));
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

/**
 * Returns a map of CBG ID to its corresponding centroid coordinate [lon, lat].
 * @return {!Map<string, [number, number]>}
 */
function getCbgToCoordMap() {
  return new Map(cbgData.features.map((feature) => {
    return [
      feature.properties['CensusBlockGroup'],
      feature.geometry.coordinates,
    ];
  }));
}

function getFirstSymbolMapLayerId(map) {
  for (const layer of map.getStyle().layers) {
    if (layer.type === 'symbol') {
      return layer.id;
    }
  }
  return null;
}
