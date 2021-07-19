import * as constants from './constants.js';
import {tokens} from '../../private/tokens.js';

function init() {
  mapboxgl.accessToken = tokens.mapbox;
}

function drawMap() {
  const map = new mapboxgl.Map({
    container: 'map',
    style: constants.MAP_STYLE,
    center: [constants.MAP_INIT_LON, constants.MAP_INIT_LAT],
    zoom: constants.MAP_INIT_ZOOM,
  });
}

function run() {
  init();
  drawMap();
}

document.addEventListener('DOMContentLoaded', run);
