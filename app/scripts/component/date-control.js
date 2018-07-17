const React = require('react');
const t = require('prop-types');
const { Link } = require('react-router-dom');
const timespan = require('../lib/timespan');
const interval = require('../config').interval;

class DateControl extends React.Component {
  render () {
    let {year, month, region} = this.props;
    let {level, state, district} = region;
    level = level || 'nation';

    // validate checks if a year is possible, ie
    // it won't allow year: 2020 or month: 15
    let valid = timespan.getValid({year: year, month: month});
    let next = timespan.next(valid);
    let prev = timespan.prev(valid);
    let currentMonth = valid.month + ' / ' + valid.year;

    let nextClassName = timespan.isLast(valid) ?
      'bttn-next inactive' : 'bttn-next';
    let prevClassName = timespan.isFirst(valid) ?
      'bttn-prev inactive' : 'bttn-prev';

    let content = region.loading ? '' : (
      <ul className='browse-date'>
      <li><Link to={level} className={prevClassName} params={{
        year: prev.year,
        month: prev.month,
        state,
        district,
        interval
      }} title='Show previous month'><span>Previous Month</span></Link></li>
      <li><Link to={level} className={nextClassName} params={{
        year: next.year,
        month: next.month,
        state,
        district,
        interval
      }} title='Show next month'><span>Next Month</span></Link></li>
      </ul>
    );

    return (
    <div className='month-label'>
      <h1 className='spane-title'>
        <small>Now Showing</small>
        <strong>{currentMonth}</strong>
      </h1>
      {content}
    </div>);
  }
}

DateControl.propTypes = {
  year: t.number,
  month: t.number,
  interval: t.string,
  region: t.object
};

module.exports = DateControl;
