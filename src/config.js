const React = require('react');

/* eslint-disable react/react-in-jsx-scope */
export default {
  mapboxAccessToken: 'pk.eyJ1IjoiZGV2c2VlZCIsImEiOiJnUi1mbkVvIn0.018aLhX0Mb0tdtaT2QNe2Q',
  apiUrl: process.env.API_URL || 'http://api.nightlights.io',
  interval: '1993.01-2013.12',
  villageLightStops: [
    -1.833,
    -1,
    -0.4577,
    -0.1333,
    0.28825,
    1.13711,
    3,
    5,
    10,
    20,
    30
  ],
  interpolation: 'basis',
  movingAverageWindow: 3,
  satelliteAdjustment: {
    // 'F12': 1.24454,
    // 'F16': 0.68629,
    // 'F18': 1.18883
  },
  dataThreshold: 400,
  unsupported: {
    title: <h1>WebGL Not Supported</h1>,
    body: <p>The visualizations on this site require a browser with WebGL rendering capabilities. Please try viewing it with a newer version of <a href='http://www.google.com/chrome/'>Chrome</a>, <a href='https://www.mozilla.org/en-US/firefox/new/'>Firefox</a>, or Safari.</p>
  }
};
/* eslint-enable react/react-in-jsx-scope */
