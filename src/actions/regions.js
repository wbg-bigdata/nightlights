import url from "url";
import titlecase from "titlecase";

import config from "../config";

export const INIT_REGION_LIST_FAILURE = "INIT_REGION_LIST_FAILURE";
export const INIT_REGION_LIST_REQUEST = "INIT_REGION_LIST_REQUEST";
export const INIT_REGION_LIST_SUCCESS = "INIT_REGION_LIST_SUCCESS";

export const initRegionList = () => dispatch => {
  dispatch({ type: INIT_REGION_LIST_REQUEST });
  return fetch(url.resolve(config.apiUrl, "districts"))
    .then(response => response.json())
    .then(data => {
      data.regions = data.regions.filter(region => region.state_key);

      let regions = [
        {
          name: "India",
          key: "india",
          level: "nation"
        }
      ];
      let states = {};
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
