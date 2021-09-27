import * as constants from 'constants.js';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import {tokens} from 'private-tokens';
import {VisitChoroplethAnalysis} from 'analysis/VisitChoroplethAnalysis.js';

import {AggregationDirection} from './enum.js';
import * as util from './analysis/util.js';

import './DataMap.css';

const PATH_QUERY_CBG_POI = 'cbg/poi/q';
const PATH_QUERY_CBG_HOME = 'cbg/home/q';

mapboxgl.accessToken = tokens.mapbox;

export function DataMap(
    {appState, dataState, mapState, queryState, setAppState, setDataState, setMapState}) {
  const mapContainerRef = useRef(null);
  const [lat] = useState(constants.INIT_LAT);
  const [lon] = useState(constants.INIT_LON);
  const [hoveredCbg, setHoveredCbg] = useState(null);
  const [map, setMap] = useState(null);
  const [poiCbgAnalysis, setPoiCbgAnalysis] = useState(null);
  const [zoom] = useState(constants.INIT_ZOOM);

  const ref = useRef({
    appState,
    dataState,
    mapState,
  });

  const getPath =
      useCallback(function(queryState) {
        switch (queryState.aggregationDirection) {
          case AggregationDirection.POI:
            return PATH_QUERY_CBG_POI;
          case AggregationDirection.HOME:
            return PATH_QUERY_CBG_HOME;
          default:
            throw new Error();
        }
      }, []);

  const constructQueryUrl =
      useCallback(function(queryState) {
        const attribute = 'naics_code';
        const path = getPath(queryState);

        let url = `http://localhost:5000/${path}`;
        url += `?a=${attribute}`
        url += `&av=${queryState.attributeClass}`
        url += `&ds=${queryState.dateStart}`
        url += `&de=${queryState.dateEnd}`
        url += `&agg=${queryState.aggregationType}`
        url += `&m=${queryState.metricType}`
        return url;
      }, [getPath]);

  const fetchDataAndUpdateMap =
      useCallback(async function(queryState, cbgValueMap) {
        const {appState} = ref.current;

        const url = constructQueryUrl(queryState);
        console.log(url);

        setAppState({...appState, loading: true});

        await fetch(url)
          .then((data) => data.json())
          .then((json) => {
            const {query, response} = json;
            for (const key of Object.keys(response)) {
              cbgValueMap.set(parseInt(key), response[key]);
            }
            console.debug(query);
            setAppState({...appState, loading: false});
          });
      }, [constructQueryUrl, setAppState]);

  useEffect(() => {
    const {mapState} = ref.current;

    setMapState({
      ...mapState,
      hoveredCbg,
    });
  }, [hoveredCbg, setMapState]);

  // Initialize.
  useEffect(() => {
    setPoiCbgAnalysis(new VisitChoroplethAnalysis(new Map(), setHoveredCbg));
  }, []);

  // Initialize map.
  useEffect(() => {
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
  }, [lat, lon, zoom]);

  // Apply analysis to map.
  useEffect(() => {
    if (!map) {
      return;
    }

    poiCbgAnalysis.applyToMap(map);
  }, [map, poiCbgAnalysis]);

  // Query data for analysis.
  useEffect(() => {
    if (!map) {
      return;
    }

    (async function() {
      const cbgValueMap = new Map();
      await fetchDataAndUpdateMap(queryState, cbgValueMap);

      const cbgNormalizedValueMap = util.normalizeSigmaMap(cbgValueMap, 4.0);
      const cbgStandardizedValueMap = util.standardizeMap(cbgValueMap, 4.0);
      const {dataState} = ref.current;

      setDataState({
        ...dataState,
        cbgNormalizedValueMap,
        cbgStandardizedValueMap,
        cbgValueMap,
      })
      poiCbgAnalysis.setCbgValueMap(cbgValueMap);
    })();
  }, [fetchDataAndUpdateMap, map, poiCbgAnalysis, queryState, setDataState]);

  return (
    <div className={appState.loading ? 'data-map loading' : 'data-map'}>
      <div ref={mapContainerRef} className="map-container" />
      <div className="spinner">
        <div className="spinner-inner-1"></div>
        <div className="spinner-inner-2"></div>
      </div>
    </div>
  );
}
