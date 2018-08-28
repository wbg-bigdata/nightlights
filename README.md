# Night Lights

The front end for the [Night Lights](nightlights.io) project.

## Installation and Usage

The steps below will walk you through setting up a development environment for the frontend.

### Prerequisites

To set up the development environment for this website, you'll need to install the following on your system:

- [Git](https://git-scm.com)
- [Node.js](http://nodejs.org), version 8 or later
- [Yarn](https://yarnpkg.com)

### Install dependencies

Clone this repository locally and run:

    yarn

### Development

Start server with live code reload at [http://localhost:9000](http://localhost:9000):

    yarn start
  
The default API endpoint is `http://api.nightlights.io`. Set the `API_URL` environment variable to use a custom API. For example:

    API_URL='http://api.custom.host:1337 yarn serve

### Build to production

Generate a minified build to `dist` folder:

    yarn build

