import url from "url";
import titlecase from "titlecase";
import config from "../config";

// Actions
export const INIT_REGION_LIST_FAILURE = "region-list/INIT_REGION_LIST_FAILURE";
export const INIT_REGION_LIST_REQUEST = "region-list/INIT_REGION_LIST_REQUEST";
export const INIT_REGION_LIST_SUCCESS = "region-list/INIT_REGION_LIST_SUCCESS";

// Initially, just one region if defined
const initialState = {
  regions: [
    {
      name: "India",
      level: "nation"
    }
  ]
};

export default (state = initialState, action) => {
  switch (action.type) {
    case INIT_REGION_LIST_SUCCESS:
      return {
        ...action.regions
      };
    default:
      return state;
  }
};

export const initRegionList = () => dispatch => {
  dispatch({ type: INIT_REGION_LIST_REQUEST });
  return fetch(url.resolve(config.apiUrl, "districts"))
    .then(response => response.json())
    .then(data => {
      data.regions = data.regions.filter(region => region.state_key);

      let regions = [];
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
          state: region.state_key
        });
      });

      // Set titlecase
      regions.forEach(r => r.name = titlecase((r.name || '').toLowerCase()));

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
