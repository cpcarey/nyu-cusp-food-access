/**
 * Returns a map of CBG ID to its corresponding GeoJSON coordinates within
 * the given CBG data.
 * @return {!Map<string, [number, number]>}
 */
export function getCbgToCoordsMap(cbgData) {
  return new Map(cbgData.features.map((feature) => {
    return [
      parseInt(feature.properties['CensusBlockGroup']),
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

export function getMean(values) {
  return values.reduce((a, b) => a + b) / values.length;
}

export function getStd(values) {
  const mean = getMean(values);
  const dists = values.map((x) => (x - mean) ** 2);
  return Math.sqrt(dists.reduce((a, b) => a + b) / values.length);
}

export function standardize(values) {
  const mean = getMean(values);
  const std = getStd(values);
  return values.map((x) => (x - mean) / std);
}

export function normalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return values.map((x) => (x - min) / (max - min));
}

export function normalizeSigma(values, sigma) {
  const mean = getMean(values);
  const std = getStd(values);

  return values.map((x) => {
    const xSigma = (x - mean) / std;
    const xNorm = (xSigma - (-sigma)) / (sigma - (-sigma));
    return Math.min(1, Math.max(0, xNorm));
  });
}

export function normalizeSigmaMap(map, sigma) {
  const keys = [...map.keys()];
  const values = keys.map((key) => map.get(key));
  const normalizedValues = normalizeSigma(values, sigma);
  return new Map(zip(keys, normalizedValues));
}

export function zip(list1, list2) {
  return Array(list1.length).fill(0).map((x, i) => [list1[i], list2[i]]);
}
