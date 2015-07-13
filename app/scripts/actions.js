var Reflux = require('reflux');

/**
 * Models the actions that the user can take.  `Reflux.createActions`
 * makes an object with the given named properties, where each property
 * is:
 *  - a function that can be called from within UI components, 'triggering'
 *    the action event.
 *  - an event emitter (not the offical Node one) that can be listened by
 *    the high-level routing logic or the `stores` that manage application
 *    state.
 *
 *  E.g., in a view component:
 *  var Actions = require('actions');
 *  Actions.chooseRegion();
 *
 *  In the routing logic:
 *  Actions.chooseRegion.listen(handler);
 */
module.exports = Reflux.createActions({
  'chooseRegion': {},
  'emphasize': {},
  'select': {},
  'selectParent': {},
  'selectDate': {},
  'selectVillages': {},
  'unselectVillages': {},
  'recenterMap': {},
  'toggleRggvy': {}
});
