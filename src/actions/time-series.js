import url from "url";

import config from "../config";

export const QUERY_TIME_SERIES_REQUEST = "QUERY_TIME_SERIES_REQUEST";
export const QUERY_TIME_SERIES_FAILURE = "QUERY_TIME_SERIES_FAILURE";
export const QUERY_TIME_SERIES_SUCCESS = "QUERY_TIME_SERIES_SUCCESS";

export const queryRegionTimeseries = region => dispatch => {
  const { state, district } = region;
  let timeseriesPath = ["months", config.interval];
  let adminType = "nation";
  let adminName = "india";
  if (!state) {
    timeseriesPath.push("states");
  } else if (!district) {
    timeseriesPath.push("states", state, "districts");
    adminType = "state";
    adminName = state;
  } else {
    timeseriesPath.push("districts", district);
    adminType = "district";
    adminName = district;
  }

  const requests = [
    fetch(url.resolve(config.apiUrl, timeseriesPath.join("/"))).then(response =>
      response.json()
    )
  ];

  if (adminType === "state") {
    requests.push(
      fetch(
        url.resolve(config.apiUrl, timeseriesPath.slice(0, -1).join("/"))
      ).then(response => response.json())
    );
  }

  return Promise.all(requests).then(values => {
    console.log(values);
  });
};
