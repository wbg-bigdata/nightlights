import React from "react";

// Components
import Modal from "./modal";

// Images
import TimelineDemoImage from '../graphics/content/timeline-demo.gif'

class WelcomeModal extends React.Component {
  render() {    
    return (
      <Modal
        {...this.props}
        title={<h1>Twenty Years of India at Night</h1>}
        body={
          <div>
            <p>
              For twenty years, a group of satellites has taken pictures of
              India every night. Researchers at the University of Michigan
              extracted nightly light readings for 600,000 villages. The
              resulting 4.4 billion data points hold{" "}
              <a href="#/stories">stories of electrification</a> in rural India.{" "}
              <a href="#/about">Learn more about this project</a> or{" "}
              <a href="http://api.nightlights.io/">
                access the data through an open API.
              </a>
            </p>
            <figure>
              <img
                src={TimelineDemoImage}
                alt="Timeline Demo"
                width="100%"
                height="100%"
              />
            </figure>
          </div>
        }        
      />
    );
  }
}

export default WelcomeModal;
