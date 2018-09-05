// Modules
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";

// App
import App from "./App";

// Components
import DataExplorer from "./components/data-explorer/";

// Libraries
import configureStore from "./store";
import registerServiceWorker from "./registerServiceWorker";

// Styles
import "./index.css";

// Store
const { store, persistor } = configureStore();

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter>
        <App>
          <Switch>
            <Route
              exact
              name="nation"
              path="/nation/:year/:month"
              component={DataExplorer}
            />
            <Route
              exact
              name="state"
              path="/state/:state/:year/:month"
              component={DataExplorer}
            />
            <Route
              exact
              name="district"
              path="/state/:state/district/:district/:year/:month"
              component={DataExplorer}
            />
            <Redirect exact from="/" to="/nation/2006/12" />
          </Switch>
        </App>
      </BrowserRouter>
    </PersistGate>
  </Provider>,
  document.getElementById("root")
);

registerServiceWorker();
