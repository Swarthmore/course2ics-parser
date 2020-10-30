#!/usr/bin/env node

const yargs = require('yargs/yargs')
const {hideBin} = require('yargs/helpers')
const fs = require('fs')
const {promisify} = require('util')
const argv = yargs(hideBin(process.argv)).argv
const Papa = require('papaparse')
const ics = require('ics')

// Promisify fs.readFile
const asyncReadFile = promisify(fs.readFile)

// Handle any script errors here
const handleError = (message) => {
    console.error('\nAn error has occurred 🤕')
    throw new Error(message)
}

// Output a debug message, only if the --verbose arg was passed
const debugMessage = (message) => {
    if (argv.verbose) {
        console.debug(message)
    }
}

// If --docs was passed as an argument, show the documentation, then end the process
if (argv.docs) {
    console.log(`
        NAME
            node-xls2ics
            
        DESCRIPTION
            Generate an iCalendar (.ics) files from a csv.
            
            The following options are available:
            
            --input     The path to the input csv. REQUIRED.
          
            --output    The path to the output ics REQUIRED.
            
            --from      The starting date. REQUIRED.
            
            --to        The ending date. REQUIRED.
            
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

(async () => {


    // Create the file path
    const fp = `${__dirname}/${argv.input}`

    // Read the CSV
    const file = await asyncReadFile(fp, 'utf8')

    // Handle the processed results
    const handleResults = (results) => {

        const header = results.data[0].map(i => i.trim())
        const rows = results.data.slice(1)

        // Handle the processing of a single row of data
        const processRow = (row) => {

            // Placeholder for the calendar event
            const event = {
                // Start is in the format [year, month, day, hour, min]
                // so [2000, 1, 5, 10, 0] would be Jan 5, 2000 10:00AM
                start: [],
                duration: { hours: 0, minutes: 0 },
                title: '',
                description: '',
                location: '',
                url: '',
                categories: ['arr', 'of', 'strings'],
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
                organizer: {
                    name: '',
                    email: ''
                },
                attendees: [
                    { name: '', email: '', rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }
                ]
            }

            // For each row item, output what it represents, along with the data
            row.forEach((item, index) => {

                const type = header[index]

                if (type === ("DAYS1" || "DAYS2")) {
                    console.log(
                        daysFromString(item)
                    )
                }

                if (type === ("TIME1" || "TIME2")) {
                    console.log(
                        timeFromString(item)
                    )
                }
            })

        }

        // Process the rows
        rows.forEach(processRow)
    }

    // Use the papa to parse the file 🍕
    Papa.parse(file, {
        complete: results => handleResults(results)
    })

})()
