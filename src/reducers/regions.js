import { INIT_REGION_LIST_SUCCESS } from '../actions/regions';

const initialState = {
  regions: []
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
