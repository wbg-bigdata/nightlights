let React = require('react');
let ajax = require('../../lib/ajax');
let Markdown = require('../markdown');
let LightCurves = require('../light-curves');

let story = {
  slug: 'election',
  title: 'Electricity Administration in Uttar Pradesh',
  introduction: 'With a population of 200 million people, Uttar Pradesh is India’s most populous state...',

  content: React.createClass({
    render () {
      let legend = (
        <g>
          <line className='line legend-line' x1='0' x2='20' y1='6' y2='6' />
          <text x='25' y='10'>Hardoi median light output</text>
          <line className='line village-line' x1='200' x2='220' y1='6' y2='6' />
          <text x='225' y='10'>{"Minister's Constituency"}</text>
        </g>
      );

      let margins = {left: 36, right: 36, top: 48, bottom: 48};

      return (
<div className='election'>
  <Markdown>{`

With a population of 200 million people, Uttar Pradesh is India’s most populous state. Roughly 80% of the population lives in rural areas and an estimated 30% of the state’s residents don’t have access to electricity at home. 

Electricity distribution in Uttar Pradesh is highly centralized; the Uttar Pradesh Power Corporation Limited (UPPCL) is a state-owned and state-run entity that manages the supply, transmission, and distribution of all electricity. A central office of the UPPCL distributes energy to four regional offices, which are then responsible for allotting their supply to local utilities. 

In 1998, a new Energy Minister for the Government of Uttar Pradesh was appointed to office from the Hardoi district. As you can see in the light curve below, during the minister’s tenure from 1998-2001, there was an increase in light output for his constituency compared with the greater Hardoi district. After the minister left his cabinet post in August 2001, there was a cutback in light output from his constituency.

  `}</Markdown>

  <div className='bleed-full'>
    <LightCurves
      expanded={true}
      margins={margins}
      {...this.state}
      showCenterlineEnvelope={false}
      legend={legend}
    />
  </div>
</div>
      );
    },

    displayName: 'Content',
    getInitialState () {
      return {
        timeSeries: { loading: true },
        villageCurves: { loading: true },
        region: {
          level: 'district',
          district: 'uttar-pradesh-hardoi'
        }
      };
    },
    componentDidMount () {
      let self = this;

      ajax('data/hardoi.json', function (err, resp) {
        if (err) { return self.setState({timeSeries: {error: err}}); }
        self.setState({timeSeries: {
          loading: false,
          results: resp,
          adminName: 'uttar-pradesh-hardoi'
        }});

        ajax('data/hardoi-86.json', function (err, resp) {
          if (err) { return self.setState({villageCurves: {error: err}}); }
          self.setState({villageCurves: {
            loading: false,
            results: resp
          }});
        });
      });
    }
  })
};

module.exports = story;
