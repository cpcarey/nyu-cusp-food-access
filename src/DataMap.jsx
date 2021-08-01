import * as constants from './constants.js';
import React, {useRef, useEffect, useState} from 'react';
import cbgData from './data/nyc_cbg_centroids.json';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import {tokens} from 'private-tokens';
import csvParse from 'csv-parse/lib/sync';
import csvDataUrl from './data/20210301_supermarkets.csv';

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

      const cbgCoordMap =
          new Map(cbgData.features.map((feature) => {
            return [
              feature.properties['CensusBlockGroup'],
              feature.geometry.coordinates,
            ];
          }));

      const cbgVisitCoordsMap = new Map();
      for (const [cbgId, visitsByCbg] of csvMap.entries()) {
        cbgVisitCoordsMap.set(
            cbgId,
            visitsByCbg.map((visits, index) => {
              // TODO: Filter out self-visits?
              return {
                coord: cbgCoordMap.get(cbgIds[index]),
                value: visits,
              };
            })
            // XXX: cbgCoordMap should never return undefined.
            .filter(({coord}) => coord)
            .filter(({value}) => value));
      }

      const cbgVisitFeaturesMap = new Map();
      for (const [cbgId, visitCoords] of cbgVisitCoordsMap.entries()) {
        cbgVisitFeaturesMap.set(
            cbgId,
            visitCoords.map(({coord, value}) => {
              const ratio = Math.min(value / 30, 1);
              return {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    cbgCoordMap.get(cbgId),
                    coord,
                  ],
                },
                properties: {
                  'opacity': ratio * 0.8,
                  'width': ratio * 5,
                },
              };
            }));
      }

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [lon, lat],
        zoom,
      });

      map.on('load', () => {
        map.addSource('cbgs', {
          data: cbgData,
          type: 'geojson',
        });

        map.addSource('cbgNetwork', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [...cbgVisitFeaturesMap.values()].reduce((a, b) => [...a, ...b]),
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
        });
      });
    })();
  }, [lat, lon, zoom]);

  return (
    <div>
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
}
