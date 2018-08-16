// Modules
import React, { Component } from "react";

// Components
import Header from "./components/header";

// Styles
import "./App.css";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Header />
        <main id="site-body" role="main">
          {this.props.children}
        </main>
      </div>
    );
  }
}

export default App;