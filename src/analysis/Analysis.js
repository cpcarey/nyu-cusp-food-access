export class Analysis {
  /**
   * @param {!Array<string>} cbgIds
   * @param {!Map<string, !Array<number>} csvMap Map of CBG ID to array of
   *   visits per CBG from adjacency matrix CSV.
   */
  constructor(cbgIds, csvMap) {
    this.cbgIds = cbgIds;
    this.csvMap = csvMap;

    this.map = null;
    this.id = null;
  }

  /**
   * Draws the network analysis on the given map as a layer.
   * @param {!mapboxgl.Map} map
   */
  applyToMap(map) {
    this.map = map;
  }

  hide() {
    if (!this.map) {
      return;
    }

    this.map.setLayoutProperty(this.id, 'visibility', 'none');
  }

  show() {
    this.map.setLayoutProperty(this.id, 'visibility', 'visible');
  }
}
