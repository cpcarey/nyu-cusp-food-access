import * as constants from 'constants.js';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import {tokens} from 'private-tokens';
import {ChoroplethAnalysis} from 'analysis/ChoroplethAnalysis.js';
import {ClusterAnalysis} from 'analysis/ClusterAnalysis.js';

import {MapPlotType} from './enum.js';
import * as util from './analysis/util.js';

import './DataMap.css';

const PATH_QUERY_CBG_HOME = 'cbg/home/q';

mapboxgl.accessToken = tokens.mapbox;

export function DataMap({
    appState, dataState, hoverState, mapState, queryState, setAppState,
    setDataState, setHoverState, setMapState}) {
  const mapContainerRef = useRef(null);
  const [lat] = useState(constants.INIT_LAT);
  const [lon] = useState(constants.INIT_LON);
  const [hoveredCbg, setHoveredCbg] = useState(null);
  const [map, setMap] = useState(null);
  const [mapPlotType, setMapPlotType] = useState(MapPlotType.CHOROPLETH);

  const [debounce, setDebounce] = useState(0);

  const [poiCbgAnalysis, setPoiCbgAnalysis] = useState(null);
  const [zoom] = useState(constants.INIT_ZOOM);

  const ref = useRef({
    appState,
    dataState,
    hoverState,
    mapState,
  });

  const debounceRef = useRef(debounce);

  const getPath =
      useCallback(function(queryState) {
        return PATH_QUERY_CBG_HOME;
      }, []);

  const constructQueryUrl =
      useCallback(function(queryState) {
        const attribute = 'category';
        const path = getPath(queryState);

        let url = `http://localhost:5000/${path}`;
        url += `?a=${attribute}`
        url += `&av=${queryState.attributeClass}`
        url += `&ds=${queryState.dateStart}`

        const date = new Date(queryState.dateStart);
        date.setDate(date.getDate() + queryState.datePeriodDuration * 7 - 1);
        const dateEnd = date.toISOString().substring(0, 10);

        url += `&de=${dateEnd}`

        if (queryState.compareAttributeClasses) {
          url += `&cav=${queryState.comparisonAttributeClass}`
        }

        if (queryState.compareDates) {
          url += `&cds=${queryState.comparisonDateStart}`
          url += `&cde=${queryState.comparisonDateEnd}`
        }

        url += `&aggs=${queryState.spatialAggregationType}`
        url += `&aggt=${queryState.temporalAggregationType}`
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
            console.log(json);
            const {query, response} = json;
            for (const key of Object.keys(response)) {
              cbgValueMap.set(parseInt(key), response[key]);
            }
            console.debug(query);
            setAppState({...appState, loading: false});
          })
          .catch((e) => {
            console.log(e);
            setAppState({...appState, loading: false});
          });
      }, [constructQueryUrl, setAppState]);

  function handleMapPlotTypeChange(e) {
    setMapPlotType(parseInt(e.target.value));
  }

  useEffect(() => {
    debounceRef.current = debounce;
  }, [debounce]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const a = setTimeout(() => {
      const {hoverState} = ref.current;

      setHoverState({
        ...hoverState,
        cbg: hoveredCbg,
      });
    }, 5);
    setDebounce(a);
  }, [hoveredCbg, setDebounce, setHoverState]);

  useEffect(() => {
    const {mapState} = ref.current;

    console.log('set map to ', mapPlotType);
    setMapState({
      ...mapState,
      plotType: mapPlotType,
    });
  }, [mapPlotType, setMapState]);

  // Initialize.
  useEffect(() => {
    switch (mapState.plotType) {
      case MapPlotType.CHOROPLETH:
        setPoiCbgAnalysis(new ChoroplethAnalysis(new Map(), setHoveredCbg));
        break;
      case MapPlotType.CLUSTER:
        setPoiCbgAnalysis(new ClusterAnalysis(new Map(), setHoveredCbg));
        break;
      default:
        return;
    }
  }, [mapState.plotType, setPoiCbgAnalysis]);

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
    if (!map || !poiCbgAnalysis) {
      return;
    }

    poiCbgAnalysis.applyToMap(map);
  }, [map, poiCbgAnalysis]);

  // Query data for analysis.
  useEffect(() => {
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
    })();
  }, [fetchDataAndUpdateMap, queryState, setDataState]);

  useEffect(() => {
    if (poiCbgAnalysis) {
      poiCbgAnalysis.setCbgValueMap(dataState.cbgValueMap);
    }
  }, [dataState, poiCbgAnalysis]);

  return (
    <div className={appState.loading ? 'data-map loading' : 'data-map'}>
      <div ref={mapContainerRef} className="map-container" />
      <div className="spinner">
        <div className="spinner-inner-1"></div>
        <div className="spinner-inner-2"></div>
      </div>
      <div className="map-controls">
        <div>
          <input
            checked={mapState.plotType === MapPlotType.CHOROPLETH}
            id="map-plot-type-0"
            name="map-plot-type"
            onChange={(e) => handleMapPlotTypeChange(e, mapState)}
            type="radio"
            value={MapPlotType.CHOROPLETH}
            />
          <label htmlFor="map-plot-type-0">Choropleth</label>
          <input
            checked={mapState.plotType === MapPlotType.CLUSTER}
            id="map-plot-type-1"
            name="map-plot-type"
            onChange={(e) => handleMapPlotTypeChange(e, mapState)}
            type="radio"
            value={MapPlotType.CLUSTER}
            />
          <label htmlFor="map-plot-type-1">Cluster</label>
        </div>
      </div>
    </div>
  );
}
