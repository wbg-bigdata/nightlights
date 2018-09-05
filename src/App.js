import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

// Components
import Header from "./components/header";
import WelcomeModal from "./components/welcome-modal";

// Styles
import "./App.css";

// Actions
import { dismissWelcomeModal } from "./reducers/context";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Header />
        <WelcomeModal
          isActive={this.props.welcomeModalIsOpen}
          onClick={this.props.dismissWelcomeModal}
        />
        <main id="site-body" role="main">
          {this.props.children}
        </main>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    welcomeModalIsOpen: state.context.welcomeModalIsOpen
  };
};

const mapDispatchToProps = {
  dismissWelcomeModal
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);
