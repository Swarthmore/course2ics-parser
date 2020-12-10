(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () {
  /**
   * Returns the from and to time from a string
   * @param str - The time string in the format of hh:mm - hh:mm
   * @returns {{ from: string, to: string }}
   * @example '12:00 - 14:00` will return { from: '12:00', to: '14:00' }
   */
  const timeFromString = str => {
    const s = str.split('-');
    const from = s[0].trim();
    const to = s[1].trim();
    return {
      from,
      to
    };
  };
  /**
   * Converts ms to days, hour, minute, seconds
   * @param ms - The time in ms
   * @see https://gist.github.com/Erichain/6d2c2bf16fe01edfcffa
   * @returns {{ hours: number, seconds: number, minutes: number, days: number }}
   */


  const convertMS = ms => {
    let days, hours, minutes, seconds;
    seconds = Math.floor(ms / 1000);
    minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    days = Math.floor(hours / 24);
    hours = hours % 24;
    return {
      days,
      hours,
      minutes,
      seconds
    };
  };
  /**
   * Return the difference in time between a time string
   * @param timeStr - The time string to get the difference from. This needs to be in the format of hh:mm - hh:mm
   * @returns {{hours: number, seconds: number, minutes: number, days: number}}
   */


  const timeDiff = timeStr => {
    // Get the hours for t1
    const {
      from,
      to
    } = timeFromString(timeStr);
    const [fromHrs, fromMins] = from.split(':');
    const [toHrs, toMins] = to.split(':'); // Use an arbitrary date for each

    const d1 = new Date(2000, 0, 1, fromHrs, fromMins);
    const d2 = new Date(2000, 0, 1, toHrs, toMins); // the following is to handle cases where the times are on the opposite side of
    // midnight e.g. when you want to get the difference between 9:00 PM and 5:00 AM

    if (d2 < d1) {
      d2.setDate(d2.getDate() + 1);
    }

    const diff = d2 - d1;
    return convertMS(diff);
  };
  /**
   * Returns a numeric representation of day string
   * @param day - The day. One of U, M, T, W, R, F, S
   * @returns {number}
   */


  const dayToNum = day => {
    switch (day) {
      case 'U':
        return 0;

      case 'M':
        return 1;

      case 'T':
        return 2;

      case 'W':
        return 3;

      case 'R':
        return 4;

      case 'F':
        return 5;

      case 'S':
        return 6;

      default:
        throw new Error('Invalid day given');
    }
  };
  /**
   * Returns the days from a string
   * @param str - The string of days in the format M,T,W,Th,F
   * @returns {string[]}
   * @example A string, 'M,Th,F' will return ['M','Th','F']
   */


  const daysFromString = str => str.split(',');
  /**
   * Return the first day that occurs, starting at fromDate
   * @param fromDate
   * @param days
   * @param times
   * @param moment - The moment instance
   * @returns {void | this | number | this | IDBRequest<IDBValidKey> | DataTransferItem | Promise<void>}
   */


  const firstDayAfterDate = (fromDate, days, times, moment) => {
    try {
      // Get the first item in the days string
      // This will give one of M,T,W,Th,F
      const [firstDay] = daysFromString(days); // Convert day to num

      const firstDayNum = dayToNum(firstDay); // Get the start time from the times string

      const {
        from: fromTime
      } = timeFromString(times); // Get the hours and minutes from fromTime

      const [hrs, mins] = fromTime.split(':'); // Create the from date object and assign the hours and minutes to it

      const from = moment(fromDate);
      from.set('hour', hrs);
      from.set('minute', mins); // placeholder for the moment object matching the first occurrence of day

      let first = moment(from); // increment first.day until it matches firstDayNum

      do {
        first = first.add(1, 'days');
      } while (first.day() !== firstDayNum); // return the first occurance


      return first;
    } catch (e) {
      throw e;
    }
  };
  /**
   * Returns FIRST LAST name
   * @param {*} str - The name in the format of LAST, FIRST
   */


  const flipName = str => {
    const split = str.split(',');
    const first = split[1].trim();
    const last = split[0].trim();
    return `${first} ${last}`;
  };

  module.exports = {
    convertMS,
    firstDayAfterDate,
    daysFromString,
    dayToNum,
    timeDiff,
    timeFromString,
    flipName
  };

})));
//# sourceMappingURL=helpers.umd.js.map
