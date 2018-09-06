import {
  QUERY_TIME_SERIES_FAILURE,
  QUERY_TIME_SERIES_REQUEST,
  QUERY_TIME_SERIES_SUCCESS
} from "../actions/regions";

const initialState = {
  loading: true,
  results: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    case QUERY_TIME_SERIES_REQUEST:
      return {
        ...state,
        loading: true
      };
    case QUERY_TIME_SERIES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.error
      };
    case QUERY_TIME_SERIES_SUCCESS:
      return {
        ...state,
        ...action.results,
        loading: false,
        error: null
      };
    default:
      return state;
  }
};
