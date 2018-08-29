import { combineReducers } from "redux";
import context from "./context";
import activeRegion from "./active-region";
import regions from "./regions";

export default combineReducers({
  context,
  activeRegion,
  regions
});
