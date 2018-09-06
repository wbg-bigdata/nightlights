import { combineReducers } from "redux";
import activeRegion from "./active-region";
import context from "./context";
import regions from "./regions";
import villages from "./villages";
import villageCurves from "./village-curves";
import timeSeries from "./time-series";

export default combineReducers({
  activeRegion,
  context,
  regions,
  timeSeries,
  villageCurves,
  villages
});
