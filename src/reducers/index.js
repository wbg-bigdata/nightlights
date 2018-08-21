import { combineReducers } from "redux";
import context from "./context";
import selectedRegion from "./selected-region";
import regionList from "./region-list";

export default combineReducers({
  context,
  selectedRegion,
  regionList
});
