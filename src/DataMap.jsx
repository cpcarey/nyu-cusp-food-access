import * as constants from 'constants.js';
import React, {useRef, useEffect, useState} from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import {tokens} from 'private-tokens';
import csvParse from 'csv-parse/lib/sync';
import csvDataUrl from 'data/20210301_supermarkets.csv';
import {NetworkAnalysis} from 'analysis/NetworkAnalysis.js';
import {VisitChoroplethAnalysis} from 'analysis/VisitChoroplethAnalysis.js';

import './DataMap.css';

mapboxgl.accessToken = tokens.mapbox;

export function DataMap() {
  const mapContainerRef = useRef(null);
  const [lon] = useState(constants.INIT_LON);
  const [lat] = useState(constants.INIT_LAT);
  const [zoom] = useState(constants.INIT_ZOOM);

  useEffect(() => {
    (async function() {
      const csvPoiMap = new Map();
      const csvHomeMap = new Map();
      let cbgIds = [];

      await fetch(csvDataUrl)
        .then((data) => data.text())
        .then((text) => {
          const csvData = csvParse(text);
          const columnCbgIds = csvData[0].slice(1);
          const rowCbgIds = csvData.slice(1).map((row) => row[0]);
          const columnCbgIdSet = new Set(columnCbgIds);
          cbgIds = [
            ...columnCbgIds,
            rowCbgIds.filter((id) => !columnCbgIdSet.has(id))
          ];

          for (let i = 1; i < csvData.length; i++) {
            csvPoiMap.set(
                csvData[i][0],
                csvData[i].slice(1).map((cell) => parseInt(cell)));
          }

          for (let i = 1; i < csvData[0].length; i++) {
            csvHomeMap.set(
                csvData[0][i],
                csvData.slice(1).map((row) => parseInt(row[i])));
          }
        });

      const poiCbgAnalysis =
          new VisitChoroplethAnalysis(cbgIds, csvPoiMap, 100);
      const homeCbgAnalysis =
          new VisitChoroplethAnalysis(cbgIds, csvHomeMap, 50, '#f8d754', 'cbg2');

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [lon, lat],
        zoom,
      });

      map.on('load', () => {
        map.resize();

        poiCbgAnalysis.applyToMap(map);
        homeCbgAnalysis.applyToMap(map);
      });
    })();
  }, [lat, lon, zoom]);

  return (
    <div className="data-map">
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
}
