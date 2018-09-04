import {
  SET_SELECTED_REGION,
  QUERY_REGION_FAILURE,
  QUERY_REGION_REQUEST,
  QUERY_REGION_SUCCESS,
  EMPHASIZE
} from "../actions/regions";

// Initially just one region if defined, when user se
const initialState = {
  loading: true,
  initialLoad: false,
  level: "nation",
  name: "India",
  emphasized: [],
  subregions: {},
  selected: null
};

export default (state = initialState, action) => {
  switch (action.type) {
    case SET_SELECTED_REGION:
      return {
        ...action.region
      };
    case EMPHASIZE:
      return {
        ...state,
        emphasized: action.keys
      };      
    case QUERY_REGION_REQUEST:
      return {
        ...state,
        loading: true
      };
    case QUERY_REGION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.error,
        rawResponse: action.rawResponse
      };
    case QUERY_REGION_SUCCESS:
      return {
        ...state,
        ...action.region,
        loading: false,
        error: null,
        initialLoad: true
      };
    default:
      return state;
  }
};
