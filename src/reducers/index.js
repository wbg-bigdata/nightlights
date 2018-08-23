import { combineReducers } from "redux";
import context from "./context";
import selectedRegion from "./selected-region";
import regions from "./regions";

export default combineReducers({
  context,
  selectedRegion,
  regions
});
