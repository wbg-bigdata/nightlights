import url from "url";
import titlecase from "titlecase";
import * as topojson from "topojson";

import config from "../config";

import sampleCount from '../data/sample-counts.json';

export const INIT_REGION_LIST_FAILURE = "INIT_REGION_LIST_FAILURE";
export const INIT_REGION_LIST_REQUEST = "INIT_REGION_LIST_REQUEST";
export const INIT_REGION_LIST_SUCCESS = "INIT_REGION_LIST_SUCCESS";

export const SET_SELECTED_REGION = "SET_SELECTED_REGION";
export const EMPHASIZE = "EMPHASIZE";

export const QUERY_REGION_REQUEST = "QUERY_REGION_REQUEST";
export const QUERY_REGION_FAILURE = "QUERY_REGION_FAILURE";
export const QUERY_REGION_SUCCESS = "QUERY_REGION_SUCCESS";

export const initRegionList = () => dispatch => {
  dispatch({ type: INIT_REGION_LIST_REQUEST });
  return fetch(url.resolve(config.apiUrl, "districts"))
    .then(response => response.json())
    .then(data => {
      // Get regions where state_key is defined
      data.regions = data.regions.filter(region => region.state_key);

      // Init regions array with nation
      let regions = [
        {
          name: "India",
          key: "india",
          level: "nation"
        }
      ];

      // Define varible to collect states
      let states = {};

      // Parse regions retrieved
      data.regions.forEach(region => {
        // Add state if not already defined
        if (!states[region.state_key]) {
          regions.push({
            name: region.state_name,
            key: region.state_key,
            level: "state"
          });
          states[region.state_key] = true;
        }

        // Add district
        regions.push({
          name: region.state_name + " / " + region.district_name,
          key: region.district_key,
          level: "district",
          state: region.state_key,
          stateName: region.state_name
        });
      });

      // Set titlecase
      regions.forEach(r => (r.name = titlecase((r.name || "").toLowerCase())));

      // Update state
      dispatch({
        type: INIT_REGION_LIST_SUCCESS,
        regions
      });
    })
    .catch(error =>
      dispatch({
        type: INIT_REGION_LIST_SUCCESS,
        error
      })
    );
};

export const queryRegionBoundaries = function(region) {
  const { level, key } = region;

  const boundariesApi =
    level === "nation"
      ? url.resolve(config.apiUrl, "boundaries/states")
      : level === "state"
        ? url.resolve(config.apiUrl, "boundaries/states/" + key)
        : url.resolve(config.apiUrl, "boundaries/districts/" + key);

  return fetch(boundariesApi) 
    .then(response => response.json())
    .then(result => {
      let boundary, properties, subregions;

      if (key && result.objects[key]) {
        let fc = topojson.feature(result, result.objects[key]);
        boundary = fc.features[0].geometry;
        properties = fc.features[0].properties;
      }

      if (result.objects.subregions) {
        let fc = topojson.feature(result, result.objects.subregions);
        subregions = {};
        fc.features.forEach(feat => subregions[feat.properties.key] = feat);

        // Add up states' populations to get a total for the nation
        if (level === 'nation') {
          properties = {
            name: 'India',
            tot_pop: fc.features.reduce((memo, feat) =>
              memo + (+feat.properties.tot_pop), 0)
          };
        }
      }

      let admin = level === 'nation' ? 'nation' : key;
      var count = sampleCount.map((obj) => {
        return obj.key === admin ? obj : null;
      }).filter((a) => a);

      return {
        key,
        name: properties.name,
        state_key: properties.state_key,
        properties,
        level,
        boundary,
        count,
        subregions
      }
    })
    .catch(err => {
      console.log('err', err);
    });

};

export const setActiveRegion = region => dispatch => {
  dispatch({ type: QUERY_REGION_REQUEST });  
  queryRegionBoundaries(region)
    .then(results => {
      dispatch({
        type: QUERY_REGION_SUCCESS,
        region: results
      });
    })
    .catch(error =>
      dispatch({
        type: QUERY_REGION_FAILURE,
        error
      })
    );;
};

export const emphasize = keys => dispatch => {
  dispatch({ type: EMPHASIZE, keys });  
}
