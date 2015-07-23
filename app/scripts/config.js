/* eslint-disable react/react-in-jsx-scope */
module.exports = {
  mapboxAccessToken: 'pk.eyJ1IjoiZGV2c2VlZCIsImEiOiJnUi1mbkVvIn0.018aLhX0Mb0tdtaT2QNe2Q',
  apiUrl: process.env.API_URL || 'http://api.nightlights.io',
  interval: '1993.01-2013.12',
  villageLightStops: [1, 2, 4, 6, 7, 8, 9, 10, 20, 30],
  satelliteAdjustment: {
    'F12': 1.24454,
    'F16': 0.68629,
    'F18': 1.18883
  },
  dataThreshold: 400,
  welcome: {
    title: <h1>Twenty Years of India at Night</h1>,
    body: (
      <div>
        <p>For twenty years, a group of satellites has taken pictures of India every night. Researchers at the University of Michigan extracted nightly light readings for 600,000 villages. The resulting 4.4 billion data points hold <a href='#/stories'>stories of electrification</a> in rural India. <a href='#/about'>Learn more about this project</a> or <a href='http://api.nightlights.io/'>access the data through an open API.</a></p>
        <figure><img src='graphics/content/timeline-demo.gif' alt='Timeline Demo' width='100%' height='100%' /></figure>
      </div>
    )
  },
  unsupported: {
    title: <h1>WebGL Not Supported</h1>,
    body: <p>The visualizations on this site require a browser with WebGL rendering capabilities. Please try viewing it with a newer version of <a href='http://www.google.com/chrome/'>Chrome</a>, <a href='https://www.mozilla.org/en-US/firefox/new/'>Firefox</a>, or Safari.</p>
  }
};
/* eslint-enable react/react-in-jsx-scope */
