import getRegion from "../lib/getRegion";

export const SET_SELECTED_REGION = "region/SET_SELECTED_REGION";

export const QUERY_REGION_REQUEST = "region/QUERY_REGION_REQUEST";
export const QUERY_REGION_FAILURE = "region/QUERY_REGION_FAILURE";
export const QUERY_REGION_SUCCESS = "region/QUERY_REGION_SUCCESS";

// Initially just one region if defined, when user se
const initialState = {
  loading: true,
  initialLoad: false,
  level: "nation",
  name: "India",
  emphasized: [],
  selected: null
};

export default (state = initialState, action) => {
  switch (action.type) {
    case SET_SELECTED_REGION:
      return {
        ...action.region
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
        loading: false,
        error: null,
        results: action.results,
        initialLoad: true
      };
    default:
      return state;
  }
};

export const setSelectedRegion = region => dispatch => {
  dispatch({
    type: SET_SELECTED_REGION,
    region
  })
};


export const setRegion = query => dispatch => {
  dispatch({ type: QUERY_REGION_REQUEST });
  return getRegion(query)
    .then(results =>
      dispatch({
        type: QUERY_REGION_SUCCESS,
        query,
        results
      })
    )
    .error(error =>
      dispatch({
        type: QUERY_REGION_SUCCESS,
        query,
        error
      })
    );
};
