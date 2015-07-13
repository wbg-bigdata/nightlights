/* eslint-disable react/react-in-jsx-scope */
module.exports = {
  apiUrl: process.env.API_URL || 'http://api.nightlights.io',
  interval: '1993.01-2013.12',
  monthlyAdjustment: [
    0,
    0.240041918956768,
    0.655312909138667,
    1.25033150700117,
    1.96090652162309,
    2.39345950492666,
    2.57615765330756,
    1.46600233424091,
    0.750891900409774,
    0.769808612440185,
    0.632921507222958,
    0.103796992481195
  ],
  satelliteAdjustment: {
    'F12': 1.24454,
    'F16': 0.68629,
    'F18': 1.18883
  },
  dataThreshold: 400,
  welcome: {
    title: <h1>Twenty Years of India at Night</h1>,
    body: <p>For twenty years, a group of satellites has taken pictures of India every night. Researchers at the University of Michigan extracted nightly light readings for 600,000 villages. The resulting 4.4 billion data points hold <a href='#/stories'>stories of electrification</a> in rural India. <a href='#/about'>Learn more about this project</a> or <a href='http://api.nightlights.io/'>access the data through an open API.</a></p>
  },
  unsupported: {
    title: <h1>WebGL Not Supported</h1>,
    body: <p>The visualizations on this site require a browser with WebGL rendering capabilities. Please try viewing it with a newer version of <a href='http://www.google.com/chrome/'>Chrome</a>, <a href='https://www.mozilla.org/en-US/firefox/new/'>Firefox</a>, or Safari.</p>

  }

};
/* eslint-enable react/react-in-jsx-scope */
