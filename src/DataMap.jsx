import * as constants from './constants.js';
import React, {useRef, useEffect, useState} from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import {tokens} from 'private-tokens';
import csvParse from 'csv-parse/lib/sync';
import csvDataUrl from './data/20210301_supermarkets.csv';
import {NetworkAnalysis} from './analysis/NetworkAnalysis.js';

mapboxgl.accessToken = tokens.mapbox;

export function DataMap() {
  const mapContainerRef = useRef(null);
  const [lon] = useState(constants.INIT_LON);
  const [lat] = useState(constants.INIT_LAT);
  const [zoom] = useState(constants.INIT_ZOOM);

  useEffect(() => {
    (async function() {
      const csvMap = new Map();
      let cbgIds = [];

      await fetch(csvDataUrl)
        .then((data) => data.text())
        .then((text) => {
          const csvData = csvParse(text);
          cbgIds = csvData[0].slice(1);
          for (let i = 1; i < csvData.length; i++) {
            csvMap.set(
                csvData[i][0],
                csvData[i].slice(1).map((cell) => parseInt(cell)));
          }
        });

      const networkAnalysis = new NetworkAnalysis(cbgIds, csvMap);

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [lon, lat],
        zoom,
      });

      map.on('load', () => {
        networkAnalysis.applyToMap(map);
      });
    })();
  }, [lat, lon, zoom]);

  return (
    <div>
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
}
