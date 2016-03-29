let React = require('react');
let Link = require('react-router').Link;
let timespan = require('../lib/timespan');
let interval = require('../config').interval;

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

    let nextClassName = timespan.isLast(valid)
      ? 'bttn-next inactive' : 'bttn-next';
    let prevClassName = timespan.isFirst(valid)
      ? 'bttn-prev inactive' : 'bttn-prev';

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
        <div className='spane-title'>
          <span>Viewing:</span>
          <span>{currentMonth}</span>
          <a href='#help-box' className='bttn-info' onClick={e => e.preventDefault()}><span>Help</span></a>
          <p className='info-box' id='help-box'>Use these arrows to move through time, and click on the map to navigate into specific regions</p>
        </div>
        {content}
      </div>
    );
  }
}

DateControl.displayName = 'DateControl';
DateControl.propTypes = {
  year: React.PropTypes.number,
  month: React.PropTypes.number,
  interval: React.PropTypes.string,
  region: React.PropTypes.object
};

module.exports = DateControl;
