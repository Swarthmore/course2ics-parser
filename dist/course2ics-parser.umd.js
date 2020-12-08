(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () {
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

  const path = require('path'); // See: https://momentjs.com/docs/#/use-it/node-js/


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
    // Output a debug message. This will only work if --verbose is passed to the script
    const debugMessage = message => {
      if (!argv.verbose) return;
      console.debug(typeof message === 'string' ? message : JSON.stringify(message));
    }; // Validate the arguments


    validateArgs(argv); // Set the output directory based on the arguments provided

    const outputDir = path.normalize(argv.outputDir);
    debugMessage(`Output dir: ${outputDir}`); // Set the input directory based on the arguments provided

    const inputFp = path.normalize(argv.inputFile);
    debugMessage(`Input file: ${inputFp}`); // Read the CSV

    const file = await fs.readFile(inputFp, 'utf8'); // Handle the processing of a single row of data

    const processRow = async row => {
      // validate the row
      const isValid = validateRow(row); // if the row is not valid, return out of the function 

      if (!isValid) {
        return;
      } // destructure everything out of the row


      const [title, subject, course, instr1, instr2, email1, email2, days1, days2, time1, time2, section] = row;
      /**
       * Creates a single ics file
       * @param instr
       * @param email
       * @param days
       * @param times
       * @returns {Promise<*>}
       */

      const createAndWriteEvent = async (instr, email, days, times) => {
        try {
          const spl = daysFromString(days);
          const rrule = new RRule({
            freq: RRule.WEEKLY,
            byweekday: spl.map(day => {
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

                default:
                  break;
              }
            }).filter(day => day),
            until: new Date(argv.toDate)
          });
          const firstDay = firstDayAfterDate(argv.fromDate, days, times, moment);
          if (!firstDay) return;
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
              name: flipName(instr),
              email: email
            }
          };
          const fp = ics.createEvent(event, async (err, val) => {
            if (err) {
              throw err;
            } // Set the file name


            const fn = `${title.replace(/[/\\?%*:|"<>\s]/g, '-')}_${section}_${days.replace(/,/g, '')}_${times.replace(/[:-\s]/g, '')}`;
            const ext = '.ics'; // Set the filepath

            const fp = `${outputDir}/${fn}${ext}`; // Save the file

            await fs.writeFile(fp, val); // Resolve promise with filepath

            return fp;
          });
          return fp;
        } catch (e) {
          // Reject promise with error
          throw e;
        }
      }; // Create the ics file for the primary event


      const fp1 = await createAndWriteEvent(instr1, email1, days1, time1);
      debugMessage(`Writing event for ${(time1)}`);
      debugMessage('Wrote new ics to disk'); // If days2 and time2 are provided, create the ics for that event

      if (days2 && time2) {
        const fp2 = await createAndWriteEvent(instr1, email1, days2, time2);
        debugMessage(`Writing event for ${(time2)}`);
        debugMessage('Wrote new ics to disk');
      }
    }; // Handle the processed results


    const handleResults = results => {
      const rows = results.data.slice(1); // Process the rows

      rows.forEach(async row => {
        await processRow(row);
      });
    }; // Use the papa to parse the file 🍕


    Papa.parse(file, {
      complete: results => handleResults(results)
    });
  }

  module.exports = {
    parse
  };

})));
//# sourceMappingURL=course2ics-parser.umd.js.map
