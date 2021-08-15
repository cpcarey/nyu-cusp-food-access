/**
 * Returns a map of CBG ID to its corresponding GeoJSON coordinates within
 * the given CBG data.
 * @return {!Map<string, [number, number]>}
 */
export function getCbgToCoordsMap(cbgData) {
  return new Map(cbgData.features.map((feature) => {
    return [
      feature.properties['CensusBlockGroup'],
      feature.geometry.coordinates,
    ];
  }));
}

export function getFirstSymbolMapLayerId(map) {
  for (const layer of map.getStyle().layers) {
    if (layer.type === 'symbol') {
      return layer.id;
    }
  }
  return null;
}
