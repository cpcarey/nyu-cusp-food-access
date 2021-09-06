export class Analysis {
  /**
   * @param {!Map<string, number>} cbgValueMap Map of CBG ID to value.
   */
  constructor(cbgValueMap) {
    this.cbgValueMap = cbgValueMap;

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
