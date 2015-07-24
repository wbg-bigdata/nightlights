let React = require('react');
let Markdown = require('../markdown');

let story = {
  slug: 'rggvy',
  title: 'Seeing the Impact of Electricity Development Projects',
  introduction: 'The Rajiv Gandhi Grameen Vidyutikaran Yojana (RGGVY) program is India’s flagship national program to increase electrification throughout the country...',

  body: (
<div id='rggvy'><Markdown>{`

Over 310 million people in India do not have electricity in their homes, and over 90% of those people live in rural areas. The Rajiv Gandhi Grameen Vidyutikaran Yojana (RGGVY) program is India’s flagship national program to increase electrification throughout the country, especially in rural areas. RGGVY launched in 2005, identifying over 100,000 villages with a population of at least 100 people that did not have access to electricity. The program subsidizes the construction of infrastructure to connect these villages to the existing grid or to provide off-grid distributed energy through generators or alternative renewable energy sources.

`}</Markdown>
  <figure className="align-center">
    <img src="graphics/stories/rggvy-anagul.png" alt="RGGVY in Anagul" />
    <figcaption>At the district level, India Lights gives you the ability to highlight and explore villages that have been beneficiaries of RGGVY. The country-wide data includes 47,000 of the 100,000 participating villages.</figcaption>
  </figure>
<Markdown>{`

People greatly benefit from access to electricity. Kids can study in the evenings, families can have better access to news, farms can use electric tools, and businesses can stay open later. Switching from kerosene to electric lighting results in better air quality and improved health for family members. The Indian government is committed to working towards universal electricity coverage, with RGGVY as the main program to achieve this goal. India’s huge population and the related population growth makes for a particularly demanding challenge; efforts to expand electrification across the country must reach unconnected areas in addition to keeping pace with population growth in areas that already have access.

The RGGVY program has four main focuses: construction of a rural electricity distribution backbone, electrification of villages that have more than 100 people, creation of distributed generation networks in areas where connecting to the grid is cost prohibitive, and providing free power connections to households below the poverty line. The program does not work to improve existing electricity access, for example by ensuring reliable service and decreasing the frequency of outages.

Night light data shows that light output in most of these villages has increased since the program, but it is difficult to isolate the impact of RGGVY from the broader trend of higher light output across the country. Additionally, in rural areas where households are connected to electricity, people typically use it for charging phones, running small appliances, and other uses that might not show up on the satellite imagery. Further research is necessary to determine how the India Lights data can be leveraged to assess the effectiveness of the RGGVY program.
`}</Markdown></div>
  ),

  content: React.createClass({
    displayName: 'Content',
    render () { return story.body; }
  })
};

module.exports = story;
