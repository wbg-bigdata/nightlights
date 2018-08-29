import { INIT_REGION_LIST_SUCCESS } from "../actions/regions";

const initialState = {
  regions: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    case INIT_REGION_LIST_SUCCESS:
      const regions = {};
      action.regions.forEach(item => {
        regions[item.key] = item;
      });
      return regions;
    default:
      return state;
  }
};
