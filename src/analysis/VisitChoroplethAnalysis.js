import cbgData from 'data/nyc_cbgs.json';

export class VisitChoroplethAnalysis {
  /**
   * @param {!Array<string>} cbgIds
   * @param {!Map<string, !Array<number>} csvMap Map of CBG ID to array of
   *   visits per CBG from adjacency matrix CSV.
   */
  constructor(cbgIds, csvMap) {
    this.cbgIds = cbgIds;
    this.csvMap = csvMap;

    this.cbgToPolygonsMap = getCbgToPolygonsMap();
    this.cbgToVisitsMap = this.getCbgToVisitsMap_();
    this.cbgToFeatureMap = this.getCbgToFeatureMap_();

    console.log(this.cbgToVisitsMap);
  }

  /**
   * Draws the network analysis on the given map as a layer.
   * @param {!mapboxgl.Map} map
   */
  applyToMap(map) {
    map.addSource('cbgPolygons', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [...this.cbgToFeatureMap.values()],
      },
    });

    map.addLayer({
      id: 'cbgPolygons',
      type: 'fill',
      source: 'cbgPolygons',
      layout: {
        visibility: 'visible',
      },
      paint: {
        'fill-color': '#b654f8',
        'fill-opacity': ['get', 'opacity'],
      },
    },
    getFirstSymbolMapLayerId(map));
  }

  convertCoordVisitToMultiPolygonFeature_(cbgId) {
    const ratio = Math.min((this.cbgToVisitsMap.get(cbgId) || 0) / 100, 1);
    return {
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: this.cbgToPolygonsMap.get(cbgId),
      },
      properties: {
        'opacity': ratio * 0.8,
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

/**
 * Returns a map of CBG ID to its corresponding centroid coordinate [lon, lat].
 * @return {!Map<string, [number, number]>}
 */
function getCbgToPolygonsMap() {
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
