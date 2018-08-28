import * as topojson from "topojson";
import sampleCount from "../data/sample-counts.json";

export default async function getRegion({ results, context }) {
  const { key, level } = context;
  let boundary, properties, subregions;
  if (key && results.objects[key]) {
    let fc = topojson.feature(results, results.objects[key]);
    boundary = fc.features[0].geometry;
    properties = fc.features[0].properties;
  }
  if (results.objects.subregions) {
    let fc = topojson.feature(results, results.objects.subregions);
    subregions = {};
    fc.features.forEach(feat => (subregions[feat.properties.key] = feat));
    // Add up states' populations to get a total for the nation
    if (level === "nation") {
      properties = {
        name: "India",
        tot_pop: fc.features.reduce(
          (memo, feat) => memo + +feat.properties.tot_pop,
          0
        )
      };
    }
  }
  const admin = level === "nation" ? "nation" : key;
  const count = sampleCount
    .map(obj => (obj.key === admin ? obj : null))
    .filter(Boolean);
  return {
    key,
    level,
    boundary,
    properties,
    subregions,
    count,
    state: context.state,
    district: context.district
  };
}
