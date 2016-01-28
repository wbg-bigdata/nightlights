let time = {

  start: {
    month: 1,
    year: 1993
  },

  end: {
    month: 12,
    year: 2013
  },

  validYear (year) {
    return year >= time.start.year && year <= time.end.year;
  },

  validMonth (month) {
    return month >= 1 && month <= 12;
  },

  nearestYear (year) {
    return year < time.start.year ? time.start.year : time.end.year;
  },

  nearestMonth (month) {
    return month < 1 ? 1 : 12;
  },

  isLast ({year, month}) {
    return year === time.end.year && month === time.end.month;
  },

  isFirst ({year, month}) {
    return year === time.start.year && month === time.start.month;
  },

  // Conveniently, the data starts on january and ends on december.
  // This means we don't need to do any more validation than checking
  // if the month is plausible (ie no months over 12).
  // TODO if the data isn't as neat, build this function out as necessary.
  getValid ({year, month}) {
    year = parseInt(year, 10);
    month = parseInt(month, 10);
    if (isNaN(year) || isNaN(month)) {
      return { year: time.start.year, month: time.start.month };
    }
    year = time.validYear(year) ? year : time.nearestYear(year);
    month = time.validMonth(month) ? month : time.nearestMonth(month);
    return { year: year, month: month };
  },

  next (valid) {
    if (time.isLast(valid)) {
      return valid;
    }
    let nextMonth = valid.month === 12 ? 1 : valid.month + 1;
    let nextYear = nextMonth === 1 ? valid.year + 1 : valid.year;
    return { month: nextMonth, year: nextYear };
  },

  prev (valid) {
    if (time.isFirst(valid)) {
      return valid;
    }
    let prevMonth = valid.month === 1 ? 12 : valid.month - 1;
    let prevYear = prevMonth === 12 ? valid.year - 1 : valid.year;
    return { month: prevMonth, year: prevYear };
  }
};

module.exports = time;
