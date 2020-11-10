#!/usr/bin/env node

const {RRule} = require('rrule')
const yargs = require('yargs/yargs')
const {hideBin} = require('yargs/helpers')
const fs = require('fs').promises
const argv = yargs(hideBin(process.argv)).argv
const Papa = require('papaparse')
const ics = require('ics')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const tz = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(tz)

dayjs.tz.setDefault('America/New_York')

/**
 * Handle script errors
 * @param message - The error message
 */
const handleError = (message) => {
    console.error('\nAn error has occurred 🤕')
    throw new Error(message)
}

// If --docs was passed as an argument, show the documentation, then end the process
if (argv.docs) {
    console.log(`
        NAME
            node-xls2ics
            
        DESCRIPTION
            Generate an iCalendar (.ics) files from a csv.
            
            The following options are available:
            
            --input     REQUIRED. The path to the input csv. 
          
            --output    REQUIRED. The path to the output ics.
            
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
            
    `)

    process.exit()
}

// If --input was not passed to the script, throw an error
if (!argv.input) {
    handleError('--input is missing')
}

// if --from was not passed to the script, throw an error
if (!argv.from) {
    handleError('--from is missing')
}

// if --to was not passed to the script, throw an error
if (!argv.to) {
    handleError('--to is missing')
}

/**
 * Returns a numeric representation of day string
 * @param day - The day. One of M,T,W,Th,F,Sa
 * @returns {number}
 */
const dayToNum = day => {
    switch(day) {
        case 'S':
            return 0
        case 'M':
            return 1
        case 'T':
            return 2
        case 'W':
            return 3
        case 'Th':
            return 4
        case 'F':
            return 5
        case 'Sa':
            return 6
        default:
            throw new Error('Invalid day given')
    }
}
/**
 * Returns the days from a string
 * @param str - The string of days in the format M,T,W,Th,F
 * @returns {string[]}
 * @example A string, 'M,Th,F' will return ['M','Th','F']
 */
const daysFromString = (str) => str.split(',')

/**
 * Returns the from and to time from a string
 * @param str - The time string in the format of hh:mm - hh:mm
 * @returns {{ from: string, to: string }}
 * @example '12:00 - 14:00` will return { from: '12:00', to: '14:00' }
 */
const timeFromString = (str) => {
    const s = str.split('-')
    const from = s[0].trim()
    const to = s[1].trim()
    return { from, to }
}

/**
 * Converts ms to days, hour, minute, seconds
 * @param ms - The time in ms
 * @see https://gist.github.com/Erichain/6d2c2bf16fe01edfcffa
 * @returns {{ hours: number, seconds: number, minutes: number, days: number }}
 */
const convertMS = (ms) => {
    let days, hours, minutes, seconds
    seconds = Math.floor(ms / 1000)
    minutes = Math.floor(seconds / 60)
    seconds = seconds % 60
    hours = Math.floor(minutes / 60)
    minutes = minutes % 60
    days = Math.floor(hours / 24)
    hours = hours % 24
    return { days, hours, minutes, seconds }
}

/**
 * Return the difference in time between a time string
 * @param timeStr - The time string to get the difference from. This needs to be in the format of hh:mm - hh:mm
 * @returns {{hours: number, seconds: number, minutes: number, days: number}}
 */
const timeDiff = (timeStr) => {

    // Get the hours for t1
    const {from, to} = timeFromString(timeStr)

    const [fromHrs, fromMins] = from.split(':')
    const [toHrs, toMins] = to.split(':')

    // Use an arbitrary date for each
    const d1 = new Date(2000, 0, 1,  fromHrs, fromMins)
    const d2 = new Date(2000, 0, 1, toHrs, toMins)

    // the following is to handle cases where the times are on the opposite side of
    // midnight e.g. when you want to get the difference between 9:00 PM and 5:00 AM
    if (d2 < d1) {
        d2.setDate(d2.getDate() + 1);
    }

    const diff = d2 - d1
    return convertMS(diff)
}

const firstDayAfterDate = (fromDate, days, times) => {
    try {
        // Get the first item in the days string
        // This will give one of M,T,W,Th,F
        const [firstDay] = daysFromString(days)
        // Convert day to num
        const firstDayNum = dayToNum(firstDay)
        // Create from date
        // Get the time and add it to the dayjs object
        const t = timeFromString(times)
        const [hrs, mins] = t.from.split(':')
        const from = dayjs(fromDate)
        from.hour(+hrs)
        from.minute(+mins)
        // placeholder for the dayjs object matching the first occurance of day
        let first = from.clone()

        do {
            first = first.add(1, 'day')

        } while (first.get('day') !== firstDayNum)

        console.log(first.format())

        // return the first occurance
        return first

    } catch (e) {
        throw e
    }
}
/**
 * The main function
 * @param argv - Arguments - See docs
 * @returns {Promise<void>}
 */
const main = async (argv) => {

    // Create the file path
    const fp = `${__dirname}/${argv.input}`

    // Read the CSV
    const file = await fs.readFile(fp, 'utf8')

    // Output a debug message. This will only work if --verbose is passed to the script
    const debugMessage = (message) => {
        return
        if (!argv.verbose) return
        console.debug(
            typeof message === 'string' ? message : JSON.stringify(message)
        )
    }

    // Handle the processing of a single row of data
    const processRow = async ([ title, subject, course, instr1, instr2, email1, email2, days1, days2, time1, time2 ]) => {

        const createAndWriteEvent = async (instr, email, days, times) => {
            try {

                const spl = daysFromString(days)
                const rrule = new RRule({
                    freq: RRule.WEEKLY,
                    byweekday: spl.map(day => {
                        switch(day) {
                            case 'M':
                                return RRule.MO
                            case 'T':
                                return RRule.TU
                            case 'W':
                                return RRule.WE
                            case 'Th':
                                return RRule.TH
                            case 'F':
                                return RRule.FR
                            default:
                                break
                        }
                    })
                        .filter(day => day),
                    until: new Date(argv.to)
                })

                const firstDay = firstDayAfterDate(argv.from, days, times)
                const eventStart = firstDay.format('YYYY-MM-DD').split('-').map(i => +i)

                const duration = timeDiff(times)

                // rrule.toString() will include the beginning RRULE:
                // This is not needed with the ics library
                // This line of code splits the returned rrule string at RRULE: and assigns the
                // second part (the part we need) to a variable.
                const [,recurrenceRule] = rrule.toString().split('RRULE:')

                const eventTitle = `${subject}${course}`

                console.log('Using date')
                console.log(firstDay.format('MMM D, YYYY HH:mm'))

                const event = {
                    // Start is in the format [year, month, day, hour, min]
                    start: [firstDay.get('year'), firstDay.get('month') + 1, firstDay.get('date'), firstDay.get('hour'), firstDay.get('minute')],
                    duration: duration,
                    recurrenceRule: recurrenceRule,
                    title: eventTitle,
                    description: title,
                    status: 'CONFIRMED',
                    organizer: {
                        name: instr,
                        email: email
                    }
                }

                const fp = ics.createEvent(event, async (err, val) => {

                    if (err) {
                        throw err
                    }

                    // Standardize ics value to conform with ics spec
                    // const newVal = val.replace(/\r\n/gm, "\n").replace(/\n/gm,   "\r\n")

                    // Set the file name
                    const fn = eventStart.join('-') + '_' + days.replace(/,/g, '') + '_' + times.replace(/[:-\s]/g, '') + '_' + subject + '-' + course + '.ics'

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
        console.log('Wrote new ics to disk', fp1)

        // If days2 and time2 are provided, create the ics for that event
        if (days2 && time2) {
            const fp2 = await createAndWriteEvent(instr1, email1, days2, time2)
            console.log('Wrote new ics to disk', fp2)
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

(async() => {
    await main(argv)
    return 0
})()