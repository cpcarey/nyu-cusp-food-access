import * as constants from 'constants.js';
import React, {useRef, useEffect, useState} from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import {tokens} from 'private-tokens';
import csvParse from 'csv-parse/lib/sync';
import csvDataUrl from 'data/20210301_cbg_density.csv';
import {NetworkAnalysis} from 'analysis/NetworkAnalysis.js';
import {VisitChoroplethAnalysis} from 'analysis/VisitChoroplethAnalysis.js';
import {NaicsCode} from 'enum.js';

import './DataMap.css';

mapboxgl.accessToken = tokens.mapbox;

export function DataMap({configState}) {
  const mapContainerRef = useRef(null);
  const [homeCbgAnalysis, setHomeCbgAnalysis] = useState(null);
  const [lat] = useState(constants.INIT_LAT);
  const [lon] = useState(constants.INIT_LON);
  const [map, setMap] = useState(null);
  const [networkAnalysis, setNetworkAnalysis] = useState(null);
  const [poiCbgAnalysis, setPoiCbgAnalysis] = useState(null);
  const [zoom] = useState(constants.INIT_ZOOM);

  const NAICS_CODES = new Map([
    [
      NaicsCode.SUPERMARKETS,
      new Set([
        4452, 445210, 445220, 445230, 445291, 445292, 445299, 311811, 445110,
      ]),
    ],
    [
      NaicsCode.GENERAL,
      new Set([4539, 445120, 452319, 453998, 452210]),
    ],
    [
      NaicsCode.RESTAURANTS,
      new Set([7225, 722511, 722513, 722514, 722515]),
    ],
    [
      NaicsCode.COMMUNITY,
      new Set([624210, 722320]),
    ],
    [
      NaicsCode.SUPPLEMENTS,
      new Set([446110, 446191]),
    ],
    [
      NaicsCode.TOBACCO_LIQUOR,
      new Set([445310, 453991, 722410]),
    ],
  ]);

  useEffect(() => {
    (async function() {
      const cbgValueMap = new Map();

      await fetch(csvDataUrl)
        .then((data) => data.text())
        .then((text) => {
          const csvData = csvParse(text);
          for (let row of csvData.slice(1)) {
            const cbgId = parseInt(row[0]);
            const naicsCode = parseInt(row[1]);
            const value = parseFloat(row[2]);
            if (NAICS_CODES.get(configState.attributeClass).has(naicsCode)) {
              cbgValueMap.set(cbgId, value);
            }
          }
        });

      setPoiCbgAnalysis(new VisitChoroplethAnalysis(cbgValueMap, 0));

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [lon, lat],
        zoom,
      });

      map.on('load', () => {
        map.resize();
        setMap(map);
      });
    })();
  }, [lat, lon, zoom]);


  useEffect(() => {
    (async function() {
      if (!map) {
        return;
      }

      const cbgValueMap = new Map();

      await fetch(csvDataUrl)
        .then((data) => data.text())
        .then((text) => {
          const csvData = csvParse(text);
          for (let row of csvData.slice(1)) {
            const cbgId = parseInt(row[0]);
            const naicsCode = parseInt(row[1]);
            const value = parseFloat(row[2]);
            if (NAICS_CODES.get(configState.attributeClass).has(naicsCode)) {
              cbgValueMap.set(cbgId, value);
            }
          }
        });

      poiCbgAnalysis.setCbgValueMap(cbgValueMap);
    })();
  }, [configState]);

  useEffect(() => {
    if (!map) {
      return;
    }

    poiCbgAnalysis.applyToMap(map);
  }, [map]);

  return (
    <div className="data-map">
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
}
