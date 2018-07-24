'use strict';

module.exports.getChildRoute = function ({region, match, location}, key) {
  let path = ['/state'];
  if (region.level === 'nation') {
    path.push(key);
  } else {
    path = path.concat([params.state, 'district', key]);
  }
  path.push(match.params.year, match.params.month, location.search || '');
  return path.join('/');
}
