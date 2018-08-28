import { createStore, applyMiddleware, compose } from "redux";
import { connectRouter, routerMiddleware } from "connected-react-router";
import thunk from "redux-thunk";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

// Reducers and Actions
import rootReducer from "./reducers";
import { initRegionList } from "./actions/regions";

import createHistory from "history/createBrowserHistory";
export const history = createHistory();

const persistConfig = {
  key: "root",
  storage
};

export default function configureStore() {
  const initialState = {};
  const enhancers = [];
  const middleware = [thunk, routerMiddleware(history)];

  // Dev Tools
  if (process.env.NODE_ENV === "development") {
    const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__;

    if (typeof devToolsExtension === "function") {
      enhancers.push(devToolsExtension());
    }
  }

  const composedEnhancers = compose(
    applyMiddleware(...middleware),
    ...enhancers
  );

  const persistedReducer = persistReducer(persistConfig, rootReducer);

  const store = createStore(
    connectRouter(history)(persistedReducer),
    initialState,
    composedEnhancers
  );

  let persistor = persistStore(store);

  store.dispatch(initRegionList());

  return { store, persistor };
}
