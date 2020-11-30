#!/usr/bin/env node

const { RRule } = require('rrule')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const fs = require('fs').promises
const argv = yargs(hideBin(process.argv)).argv
const Papa = require('papaparse')
const ics = require('ics')
const moment = require('moment')
const { validateArgs, validateRow } = require('./validators')
const { daysFromString, timeDiff, firstDayAfterDate, flipName } = require('./helpers')

// See: https://momentjs.com/docs/#/use-it/node-js/
moment().format()

// See: https://github.com/moment/moment/issues/3488
moment.suppressDeprecationWarnings = true;

// If --docs was passed as an argument, show the documentation, then end the process
if (argv.docs) {
  console.log(`
        NAME
            course2ics
            
        DESCRIPTION
            Generate an iCalendar (.ics) files from a csv.
            
            The following options are available:
            
            --input     REQUIRED. The path to the input csv. 
            
            --from      REQUIRED. The starting date. Must be in ISO format YYYY-MM-DD. 
            
            --to        REQUIRED. The ending date. Must be in ISO format YYYY-MM-DD.

            --verbose   Run with verbose output.
        
            --docs      View the help docs (You're reading them! 🚀)
        
        
        CSV FORMAT
            The input csv MUST be in the following format
            
            TITLE, SUBJ, CRSE, INSTR1, INSTR2, INSTR1_EMAIL, INSTR2_EMAIL, DAYS1, DAYS2, TIME1, TIME2

            TITLE           The title of the event
            SUBJ            The course subject
            CRSE            The course number
            INSTR1          The full name of the primary instructor, in the format Last, First
            INSTR2          The full name of the secondary instructor, in the format Last, First
                            This field may also be blank
            INSTR1_EMAIL    The email address of the primary instructor
            INSTR2_EMAIL    The email address of the secondary instructor
            DAYS1           A comma delimited set of days when the event happens.
                            M = Monday, T = Tuesday, W = Wednesday, Th = Thursday, F = Friday, S = Saturday, Su = Sunday
                            Ex: M,T,W,Th,F
            DAYS2           A comma delimited set of days when the event happens. This second set is optional.
            TIME1           The time for when the events defined in DAYS1 occur, in the format of HH-DD (24 hours)
            TIME2           The time for when the events defined in DAYS2 occur, in the format of HH-DD (24 hours)
            
        EXAMPLE USAGE
            node src/index.js --input=/path/to/input.csv --from=2020-01-01 --to=2020-03-01 
        
        CAVEATS
            Files will be saved to PROJECT_ROOT/output. This means the output folder must be created before usage.
            
    `)

  process.exit()
}

// Output a debug message. This will only work if --verbose is passed to the script
const debugMessage = (message) => {
  if (!argv.verbose) return
  console.debug(
    typeof message === 'string' ? message : JSON.stringify(message)
  )
}

/**
 * The main function
 * @param argv - Arguments - See docs
 * @returns {Promise<void>}
 */
const main = async (argv) => {

  // Validate the arguments
  validateArgs(argv)

  // Create the file path
  const fp = `${__dirname}/${argv.input}`

  // Read the CSV
  const file = await fs.readFile(fp, 'utf8')

  // Handle the processing of a single row of data
  const processRow = async (row) => {

    // validate the row
    const isValid = validateRow(row)

    // if the row is not valid, return out of the function 
    if (!isValid) {
      return
    }

    // destructure everything out of the row
    const [title, subject, course, instr1, instr2, email1, email2, days1, days2, time1, time2] = row

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

        const spl = daysFromString(days)

        const rrule = new RRule({
          freq: RRule.WEEKLY,
          byweekday: spl.map(day => {
            switch (day) {
              case 'U':
                return RRule.SU
              case 'M':
                return RRule.MO
              case 'T':
                return RRule.TU
              case 'W':
                return RRule.WE
              case 'R':
                return RRule.TH
              case 'F':
                return RRule.FR
              case 'S':
                return RRule.SA
              default:
                break
            }
          })
            .filter(day => day),
          until: new Date(argv.to)
        })

        const firstDay = firstDayAfterDate(argv.from, days, times, moment)

        if (!firstDay) return

        const start = firstDay.format('YYYY-M-D-H-m').split("-")

        const duration = timeDiff(times)

        // rrule.toString() will include the beginning RRULE:
        // This is not needed with the ics library
        // This line of code splits the returned rrule string at RRULE: and assigns the
        // second part (the part we need) to a variable.
        const [, recurrenceRule] = rrule.toString().split('RRULE:')

        const eventTitle = `${subject}${course}`

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
        }

        const fp = ics.createEvent(event, async (err, val) => {

          if (err) {
            throw err
          }

          // Set the file name
          const fn = `${title.replace(/^[0-9a-zA-Z ]+$/g, '')}_${days.replace(/,/g, '')}_${times.replace(/[:-\s]/g, '')}` + '.ics'

          // Set the filepath
          const fp = `output/${fn}`

          // Save the file
          await fs.writeFile(fp, val)

          // Resolve promise with filepath
          return fp

        })

        return fp

      } catch (e) {
        // Reject promise with error
        throw e
      }
    }

    // Create the ics file for the primary event
    const fp1 = await createAndWriteEvent(instr1, email1, days1, time1)
    debugMessage(`Writing event for ${instr1, email1, days1, time1}`)
    debugMessage('Wrote new ics to disk', fp1)

    // If days2 and time2 are provided, create the ics for that event
    if (days2 && time2) {
      const fp2 = await createAndWriteEvent(instr1, email1, days2, time2)
      debugMessage(`Writing event for ${instr1, email1, days2, time2}`)
      debugMessage('Wrote new ics to disk', fp2)
    }

  }

  // Handle the processed results
  const handleResults = (results) => {
    const rows = results.data.slice(1)
    // Process the rows
    rows.forEach(async row => {
      await processRow(row)
    })
  }

  // Use the papa to parse the file 🍕
  Papa.parse(file, {
    complete: results => handleResults(results)
  })

}

// Run the script
(async () => {
  await main(argv)
  return 0
})()