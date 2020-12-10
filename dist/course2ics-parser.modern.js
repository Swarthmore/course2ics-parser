function _asyncIterator(iterable) {
  var method;

  if (typeof Symbol !== "undefined") {
    if (Symbol.asyncIterator) {
      method = iterable[Symbol.asyncIterator];
      if (method != null) return method.call(iterable);
    }

    if (Symbol.iterator) {
      method = iterable[Symbol.iterator];
      if (method != null) return method.call(iterable);
    }
  }

  throw new TypeError("Object is not async iterable");
}

const {
  RRule
} = require('rrule');

const fs = require('fs').promises;

const Papa = require('papaparse');

const ics = require('ics');

const moment = require('moment');

const {
  validateArgs,
  validateRow
} = require('./validators');

const {
  daysFromString,
  timeDiff,
  firstDayAfterDate,
  flipName
} = require('./helpers');

const path = require('path'); // readCsvFunction -> papaParseCsv -> for each row, create an ics file -> if processed successfully, add row and filepath to index json -> once all rows are processed, resolve a promise with the index json and output directory
// See: https://momentjs.com/docs/#/use-it/node-js/


moment().format(); // See: https://github.com/moment/moment/issues/3488

moment.suppressDeprecationWarnings = true;
/**
 * Parses a csv and creates an ics file for each row. The generated ics will contain events recurring weekly from
 * the given fromDate until the given toDate.
 *  
 * @param {Object}  argv - The function arguments
 * @param {boolean} argv.verbose - Runs the function in verbose mode
 * @param {string}  argv.outputDir - The directory to save the files to. This directory must exist.
 * @param {string}  argv.inputFile - The input csv
 * @param {string}  argv.toDate - The starting date
 * @param {string}  argv.fromDate - The end date
 * 
 * @returns {Promise<void>}
 */

async function parse(argv) {
  /**
   * Output a debug message. This will only work if --verbose is passed to the script
   * @param {string} message - The message to output 
   * @returns void
   */
  const debugMessage = message => {
    if (!argv.verbose) return;
    console.debug(typeof message === 'string' ? message : JSON.stringify(message));
  };
  /**
   * Reads a CSV file from disk
   * @param {string} filepath - The path to the csv
   * @returns {Promise<string>} - The contents of the file
   */


  async function readCsv(filepath) {
    try {
      return await fs.readFile(filepath, 'utf8');
    } catch (e) {
      return e;
    }
  }
  /**
   * Creates an ics event
   * 
   * @param {Object} args - The function arguments
   * @param {string} args.subject
   * @param {string} args.course
   * @param {string} args.section
   * @param {string} args.instructor
   * @param {string} args.email
   * @param {string} args.days
   * @param {string} args.times
   * @param {string} args.fromDate
   * @param {string} args.toDate 
   * 
   * @returns {Promise<string>} - Returns a promise that resolves with the ICS event
   */


  async function createIcsEvent({
    title,
    subject,
    course,
    section,
    instructor,
    email,
    days,
    times,
    fromDate,
    toDate
  }) {
    const daysArr = daysFromString(days);
    const rrule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: daysArr.map(day => {
        switch (day) {
          case 'U':
            return RRule.SU;

          case 'M':
            return RRule.MO;

          case 'T':
            return RRule.TU;

          case 'W':
            return RRule.WE;

          case 'R':
            return RRule.TH;

          case 'F':
            return RRule.FR;

          case 'S':
            return RRule.SA;
        }
      }).filter(day => day),
      until: new Date(toDate)
    });
    const firstDay = firstDayAfterDate(fromDate, days, times, moment);
    const start = firstDay.format('YYYY-M-D-H-m').split("-");
    const duration = timeDiff(times); // rrule.toString() will include the beginning RRULE:
    // This is not needed with the ics library
    // This line of code splits the returned rrule string at RRULE: and assigns the
    // second part (the part we need) to a variable.

    const [, recurrenceRule] = rrule.toString().split('RRULE:');
    const eventTitle = `${subject} ${course} ${section}`;
    const event = {
      // Start is in the format [year, month, day, hour, min]
      start: start,
      duration: duration,
      recurrenceRule: recurrenceRule,
      title: eventTitle,
      description: title,
      status: 'CONFIRMED',
      organizer: {
        name: flipName(instructor),
        email: email
      }
    };
    return new Promise((resolve, reject) => {
      ics.createEvent(event, (err, val) => {
        if (err) reject(err);
        resolve(val);
      });
    });
  }
  /**
   * Writes an ics file to disk
   * @param {string} icsData - The generated ics data 
   * @param {string} fileName - The full file name to save
   * @returns {Promise<string>} - Returns a promise that will resolve with the created filename
   */


  async function writeIcsToDisk(icsData, fileName) {
    try {
      await fs.writeFile(fileName, icsData);
      return fileName;
    } catch (e) {
      return e;
    }
  }
  /**
   * Runs the parser
   * @return {Promise<void>}
   */


  async function runParser() {
    Papa.parse(csv, {
      complete: async results => {
        // keep track of the created files, along with the source row
        let created = []; // Get the rows from papa parse

        const rows = results.data.slice(1);
        let i = 0;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;

        var _iteratorError;

        try {
          for (var _iterator = _asyncIterator(rows), _step, _value; _step = await _iterator.next(), _iteratorNormalCompletion = _step.done, _value = await _step.value, !_iteratorNormalCompletion; _iteratorNormalCompletion = true) {
            let r = _value;

            try {
              debugMessage('-------------------------------------------');
              debugMessage(`Processing row ${i}`);
              debugMessage(r); // validate the row

              const row = await validateRow(r);
              const [title, subject, course, instr1, instr2, email1, email2, days1, days2, time1, time2, section] = row;
              const ics1 = await createIcsEvent({
                title,
                subject,
                course,
                section,
                instructor: instr1,
                email: email1,
                days: days1,
                times: time1,
                fromDate: args.fromDate,
                toDate: args.toDate
              }); // Set the file name

              const fn1 = `${title.replace(/[/\\?%*:|"<>\s]/g, '-')}__${section}_${days1.replace(/,/g, '')}__${time1.replace(/[:-\s]/g, '')}`;
              const ext = '.ics';
              const fp1 = path.join(outputDir, fn1 + ext);
              const f1 = await writeIcsToDisk(ics1, fp1);
              debugMessage('Created' + ' ' + f1);
              created.push({
                title,
                subject,
                course,
                section,
                instructor: instr1,
                email: email1,
                days: days1,
                times: time1,
                fromDate: args.fromDate,
                toDate: args.toDate,
                filename: f1
              });

              if (days2 && time2) {
                const ics2 = await createIcsEvent({
                  title,
                  subject,
                  course,
                  section,
                  instructor: instr1,
                  email: email1,
                  days: days2,
                  times: time2,
                  fromDate: args.fromDate,
                  toDate: args.toDate
                });
                const fn2 = `${title.replace(/[/\\?%*:|"<>\s]/g, '-')}__${section}_${days2.replace(/,/g, '')}__${time2.replace(/[:-\s]/g, '')}`;
                const fp2 = path.join(outputDir, fn2 + ext);
                const f2 = await writeIcsToDisk(ics2, fp2);
                debugMessage('Created' + ' ' + f2);
                created.push({
                  title,
                  subject,
                  course,
                  section,
                  instructor: instr1,
                  email: email1,
                  days: days2,
                  times: time2,
                  fromDate: args.fromDate,
                  toDate: args.toDate,
                  filename: f2
                });
              }
            } catch (e) {
              console.error(e);
            } finally {
              i++;
            }
          } // once everything is done processing, create the index json file

        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              await _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        await fs.writeFile(outputDir + '/' + 'index.json', JSON.stringify(created), 'utf8');
        debugMessage('Done!');
        return;
      }
    });
  } // Validate the arguments


  const args = await validateArgs(argv); // Set the output directory based on the arguments provided

  const outputDir = path.normalize(args.outputDir); // Read the CSV

  const csv = await readCsv(path.normalize(args.inputFile));
  return await runParser();
}

module.exports = {
  parse
};
//# sourceMappingURL=course2ics-parser.modern.js.map
