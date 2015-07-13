var logo = [
'╭──────────────────────────────────────╮',
'│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│',
'│░░░░░░░░░░░░░░█░░░░░░░░░░░░░░░░░░░░░░░│',
'│░░░░░░░░░░░░░░░█░░█░░░░█░░░░░░░░░░░░░░│',
'│░░░░░░░░░░░░░░░██░░█░░██░░░░░░░░░░░░░░│',
'│░░░░░░░░░░░░░░░███░█░███░░░░░░░░░░░░░░│',
'│░░░░░░░░░░░░░░░███░████░░░░░░░░░░░░░░░│',
'│░░░░░░░░░░░░░░░███████░░░░░░█░░░█░░░░░│',
'│░░░░░░░░██░░░░░██████░░░░░██░░██░░░░░░│',
'│░░░░░█░░░██░░░░░█████░░░███░███░░░░░░░│',
'│░░░░░░██░░███░░░█████░░██████░░░░░░░░░│',
'│░░░░░░░░██░███░░█████░░████░░░░░░░░░░░│',
'│░░░░░░░░░██████░░████░███░░░░░░░░░░░░░│',
'│░░░░░░░░░░░░████░███░░█░░░░░░░░░░░░░░░│',
'│░░░░░░█████░░░░████░░░░░░░░░░░░░░░░░░░│',
'│░░░░░░░░██████░░░██░░░█░░░░░░░░░░░░░░░│',
'│░░░░░░░░░░░░████░█████░░░░░░░░░░░░░░░░│',
'│░░░░░░░░░░░░░░██████░░░░░░░░░░░░░░░░░░│',
'│░░░░░░░░░░░░░░░░░███░░░░░░░░░░░░░░░░░░│',
'╰──────────────────────────────────────╯'
];

var colors = [];
logo = logo
.map(function (line, i) {
  return line
  .replace(/(^|[|│])|(░+)|(█+)/g, function (match, p1, p2, p3) {
    if (p1) {
      colors.push('black');
      return '%c' + p1;
    } else if (p2) {
      colors.push('#cf3f02');
      return '%c' + p2;
    } else if (p3 || !match) {
      colors.push('black');
      return '%c' + (p3 || '');
    }
  });
})
.concat([
'                                        '
])
.join('\n');

colors = colors.map(function (c) {
  return 'color: ' + c;
})
.concat([]);

module.exports = function () {
  console.log('%cWelcome to India Lights: visualizing 20 years of nightly satellite data across 600,000 villages in India.', 'color: #cf3f02; font-weight: bold');
  console.log('%cGet the data directly at http://api.nightlights.io', 'color: black; font-weight: bold;');
  console.log.apply(console, [logo].concat(colors));
  console.log('%cMade with &hearts; by Development Seed [https://developmentseed.org]', 'font-weight: bold;color: #cf3f02');
};

