import { REHYDRATE } from "redux-persist";

export const CONTEXT_UPDATE = "context/UPDATE";

// Initially just one region if defined, when user se
const initialState = {
  welcomeModalIsOpen: true
};

export default (state = initialState, action) => {
  switch (action.type) {
    case CONTEXT_UPDATE: {
      return {
        ...state,
        [action.context]:
          typeof action.data === "object"
            ? {
                ...state[action.context],
                ...action.data
              }
            : action.data
      };
    }
    case REHYDRATE: {
      const context = action.payload ? action.payload.context : {};

      return {
        ...state,
        ...context,
        rehydrated: true
      };
    }
    default:
      return state;
  }
};

export const dismissWelcomeModal = () => dispatch => {
  dispatch({
    type: CONTEXT_UPDATE,
    context: "welcomeModalIsOpen",
    data: false
  });
};
