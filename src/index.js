#!/usr/bin/env node

const {RRule, RRuleSet, rrulestr} = require('rrule')
const yargs = require('yargs/yargs')
const {hideBin} = require('yargs/helpers')
const fs = require('fs').promises
const argv = yargs(hideBin(process.argv)).argv
const Papa = require('papaparse')
const ics = require('ics')
const dayjs = require('dayjs')
const dayjsToArray = require('dayjs/plugin/toArray')

dayjs.extend(dayjsToArray)

// Handle any script errors here
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
            node src/index.js --input=/path/to/input.csv --output=/path/to/output.ics         
            
    `)

    process.exit()
}

// If --input was not passed to the script, throw an error
if (!argv.input) {
    handleError('--input is missing')
}

// if --output was not passed to the script, throw an error
if (!argv.output) {
    handleError('--output is missing')
}

// if --from was not passed to the script, throw an error
if (!argv.from) {
    handleError('--from is missing')
}

// if --to was not passed to the script, throw an error
if (!argv.to) {
    handleError('--to is missing')
}

// returns the days from a string
// ex. A string, 'M,Th,F' will return ['M','Th','F']
const daysFromString = (str) => str.split(',')

// returns the from and to time from a string
// ex. A string, '12:00 - 14:00` will return { from: '12:00', to: '14:00' }
const timeFromString = (str) => {
    const s = str.split('-')
    const from = s[0].trim()
    const to = s[1].trim()
    return { from, to }
}

// converts ms to days, hour, minute, seconds
// https://gist.github.com/Erichain/6d2c2bf16fe01edfcffa
const convertMS = ( ms ) => {
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



const main = async (argv) => {

    // Create the file path
    const fp = `${__dirname}/${argv.input}`

    // Read the CSV
    const file = await fs.readFile(fp, 'utf8')

    // Output a debug message. This will only work if --verbose is passed to the script
    const debugMessage = (message) => {
        if (!argv.verbose) return
        console.debug(
            typeof message === 'string' ? message : JSON.stringify(message)
        )
    }

    // Handle the processing of a single row of data
    const processRow = ([ title, subject, course, instr1, instr2, email1, email2, days1, days2, time1, time2 ]) => {

        // Create the rrule for days1 & times1
        const splitDays1 = daysFromString(days1)
        const rrule1 = new RRule({
            freq: RRule.WEEKLY,
            byweekday: splitDays1.map(day => {
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
            dtstart: new Date(argv.from),
            until: new Date(argv.to)
        })

        console.debug('Processing days')
        console.debug(splitDays1)

        console.debug('rrule set')
        console.debug(rrule1)

        const formattedStart = dayjs(argv.from).format('YYYY-MM-DD').split('-')

        console.debug('Formatting start datetime')
        console.debug(formattedStart)

        // Create the ICS for days1 & times1
        const event1 = {
            // Start is in the format [year, month, day, hour, min]
            start: [...formattedStart, 0, 0],
            duration: timeDiff(time1),
            recurrenceRule: rrule1.toString(),
            title: `${subject} ${course}`,
            description: title,
            status: 'CONFIRMED',
            organizer: {
                name: instr1,
                email: email1
            }
        }

        ics.createEvent(event1, async (err, val) => {
            if (err) {
                console.error(err)
                return
            }

            console.debug('Event created')
            console.debug('Writing file to disk')

            // Save the event to the folder specified
            const filename = `${formattedStart}_${subject}_${course}.ics`.replace(/[^\w\s]/gi, '_')
            await fs.writeFile(`output/${filename}`, val.replace(/\r\n/gm, "\n").replace(/\n/gm,   "\r\n"), {flag: 'w', encoding: 'utf8'})

        })

        // Create ICS for days2 & times2 (if they exist)
        // const splitDays2 = daysFromString(days)

        // Create the ICS for days2 & times2

    }

    // Handle the processed results
    const handleResults = (results) => {
        const header = results.data[0].map(i => i.trim())
        const rows = results.data.slice(1)
        // Process the rows
        rows.forEach(processRow)
    }

    // Use the papa to parse the file 🍕
    Papa.parse(file, {
        complete: results => handleResults(results)
    })

}

(async() => {
    await main(argv)
})()