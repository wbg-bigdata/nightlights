let React = require('react');
let timespan = require('../lib/timespan');

class DateControl extends React.Component {
  constructor () {
    super();
    this.next = this.next.bind(this);
    this.prev = this.prev.bind(this);
  }

  next (e) {
    this.props.onChangeDate(timespan.next(timespan.getValid(this.props)));
    e.preventDefault();
  }

  prev (e) {
    this.props.onChangeDate(timespan.prev(timespan.getValid(this.props)));
    e.preventDefault();
  }

  render () {
    let valid = timespan.getValid({year: this.props.year, month: this.props.month});
    let currentMonth = valid.month + ' / ' + valid.year;
    let nextClassName = timespan.isLast(valid)
      ? 'bttn-next inactive' : 'bttn-next';
    let prevClassName = timespan.isFirst(valid)
      ? 'bttn-prev inactive' : 'bttn-prev';

    return (
      <div className='month-label'>
        <div className='spane-title'>
          <span>Viewing:</span>
          <span>{currentMonth}</span>
          <a href='#help-box' className='bttn-info' onClick={e => e.preventDefault()}><span>Help</span></a>
          <p className='info-box' id='help-box'>Use these arrows to move through time, and click on the map to navigate into specific regions</p>
          {this.props.region.loading ? '' : (
          <div className='browse-date'>
            <ul>
              <li>
                <a href='#' className={prevClassName} onClick={this.prev}
                  title='Show previous month'><span>Previous Month</span></a>
              </li>
              <li>
                <a href='#' className={nextClassName} onClick={this.next}
                  title='Show next month'><span>Next Month</span></a>
              </li>
            </ul>
          </div>
        )}
        </div>
      </div>
    );
  }
}

DateControl.displayName = 'DateControl';
DateControl.propTypes = {
  year: React.PropTypes.number,
  month: React.PropTypes.number,
  interval: React.PropTypes.string,
  region: React.PropTypes.object,
  onChangeDate: React.PropTypes.func
};

module.exports = DateControl;
