const { createStore, applyMiddleware, compose } = require('redux');
const thunkMiddleware = require('redux-thunk').default;
const reducer = require('../reducers');
const initialState = {};
const store = createStore(reducer, initialState, compose(applyMiddleware(
  thunkMiddleware
)));
module.exports = store;
