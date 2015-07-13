let React = require('react');
let Markdown = require('../markdown');
let d3 = require('d3');

let story = {
  slug: 'diwali',
  title: 'Seeing Diwali from Space',
  introduction: 'Each year, people from around India gather to celebrate Diwali, the festival of lights. The multiday festival...',

  body: (
    <div className='diwali'>
      <Markdown>{`

  Each year, people from around India gather to celebrate Diwali, the festival
  of lights. The multi-day festival centers around the lighting of lamps and
  candles and frequently includes a spectacular fireworks display. With the India Lights
  dataset, you can see these festivities from space.

  The festival occurs in either October or November of each year. A plot of this
  time of year, showing the mean night light intensities across a random sample
  of villages throughout the country, often reveals obvious peaks during Diwali (highlighted).

      `}</Markdown>
      <figure>
        <div className='media-wrapper' id='random-sample'></div>
        <div className='year-switcher' id='year-switcher'>
          <span id='year'></span>
          <a className='bttn bttn-prev'></a>
          <a className='bttn bttn-next'></a>
        </div>
        <figcaption>Sampled Villages, 2005-2013</figcaption>
      </figure>

      <Markdown>{`
  Variable sensor calibration, weather, and data availability can all introduce
  some noise to the data which makes it difficult to identify Diwali in some
  years. Ironically, the fireworks at the peak of the festival can also leave smoke
  and pollution which, depending on wind patterns, can obscure the lighting below.
  You can view examples of individual village data to see even more obvious local peaks in
  certain areas. On some days, there are multiple light intensity measurements due to multiple satellites.

      `}</Markdown>
      <figure className='bleed-full'>
        <div className='media-wrapper' id='small-multiples'></div>
        <figcaption>Selected Villages, 2007</figcaption>
      </figure>

  </div>
  ),

  content: React.createClass({
    displayName: 'Content',
    render () { return story.body; },
    componentDidMount () {

      function updateChart (data, chartNode, xTicks, selYear, margin, width, height, switchYear) {
        // ignoring animation for now
        chartNode.selectAll('.axis').remove();
        chartNode.selectAll('rect').remove();
        chartNode.selectAll('.dot').remove();

        let x = d3.time.scale()
                  .domain(d3.extent(data, function(d) { return d.date; }))
                  .range([ 0, width ]);

        let y = d3.scale.linear()
                  .domain([0, d3.max(data, function(d) { return d.value; }) + 3])
                  .range([ height, 0 ]);

        let xAxis = d3.svg.axis()
                      .scale(x)
                      .orient('bottom')
                      .ticks(xTicks);

        chartNode.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .attr('class', 'main axis date')
            .call(xAxis);

        let yAxis = d3.svg.axis()
                      .scale(y)
                      .orient('left')
                      .ticks(5);

        chartNode.append('g')
            .attr('transform', 'translate(0,0)')
            .attr('class', 'main axis value')
            .call(yAxis);

        chartNode.append('rect')
            .attr('class','envelope')
            .attr('width', width / 60)
            .attr('height', height)
            .attr('x', x(diwaliDates[String(selYear)]) - width / 120)
            .attr('y',0);

        chartNode.selectAll('dot')
            .data(data)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', function (d) { return x(d.date); } )
            .attr('cy', function (d) { return y(d.value); } )
            .attr('r', width / 120);

        if (switchYear) {
          d3.select('#year-switcher span').html(selYear)
        }

        d3.selectAll('.axis.value .tick').each(function(){
          if (d3.select(this).select('text').html() === '0') {
            d3.select(this).select('text').html('');
            d3.select(this).select('line').remove();
          }
        });
      };

      function csvHelper (row) {
        row.value = +row.vis || +row.value;
        row.year = +row.year;
        row.date = new Date(+row.year, +row.month - 1, +row.day)
        return row;
      };

      let node = React.findDOMNode(this);
      let margin = {top: 20, right: 40, bottom: 30, left: 60}

      let width = node.offsetWidth - margin.left - margin.right;
      let height =  node.offsetHeight - margin.top - margin.bottom;
      let svg = d3.select(node).select('#random-sample').append('svg')
        .attr('width', width + margin.right + margin.left)
      	.attr('height', height + margin.top + margin.bottom)
      	.attr('class', 'chart');

      let main = svg.append('g')
      	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      	.attr('width', width)
      	.attr('height', height)
      	.attr('class', 'main');

      let diwaliDates = {
        '2005': new Date (2005, 10, 1),
        '2006': new Date (2006, 9, 21),
        '2007': new Date (2007, 10, 9),
        '2008': new Date (2008, 9, 28),
        '2009': new Date (2009, 9, 17),
        '2010': new Date (2010, 10, 5),
        '2011': new Date (2011, 9, 26),
        '2012': new Date (2012, 10, 13),
        '2013': new Date (2013, 10, 3)
      };

      d3.csv('data/nightlysamples.csv', csvHelper, function(err, data) {
        if (err) {
          console.warn(err);
          main.append('text').text('ERROR LOADING DATA');
        }
        else {

          // starting date
          let year = 2005;

          let yearData = data.filter(function(d) {
            return d.year === year;
          });

          updateChart(yearData, main, 10, year, margin, width, height, true);

          d3.selectAll('.bttn').on('click', function(){
            let indexShift = (d3.select(this).classed('bttn-next')) ? 1 : -1;
            let dates = Object.keys(diwaliDates)
            let index = friendlyMod(year + indexShift - 2005, dates.length);
            year = Number(dates[index]);
            yearData = data.filter(function(d) {
              return d.year === year;
            });
            updateChart(yearData, main, 10, year, margin, width, height, true);
          });

          function friendlyMod (num, mod) {
            return ((num % mod) + mod) % mod;
          };
        }
        }
      );

      let selectedVillages = [
        'punjab-301000500155200',
        'haryana-616000200517900',
        'delhi-708000100012000'
      ];

      let smallMultiples = d3.select(node).select('#small-multiples');

      selectedVillages.forEach(function(village) {
        d3.csv('data/2007/' + village + '.csv', csvHelper, function(err, data){

          let margin = {top: 20, right: 20, bottom: 40, left: 40}
          let width =  (1.3 * node.offsetWidth / selectedVillages.length) - margin.left - margin.right;
          let height =  300 - margin.top - margin.bottom;
          let svg = smallMultiples.append('svg')
            .attr('width', width + margin.right + margin.left)
          	.attr('height', height + margin.top + margin.bottom)
          	.attr('class', 'smallChart');

          let little = svg.append('g')
          	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
          	.attr('width', width)
          	.attr('height', height)
          	.attr('class', 'little');

          let year = 2007;

          updateChart(data, little, 2, year, margin, width, height, false);
        });
      });
    }
  })
};

module.exports = story;
