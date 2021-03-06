const { RRule } = require('rrule')
const fs = require('fs').promises
const Papa = require('papaparse')
const ics = require('ics')
const moment = require('moment')
const { validateArgs, validateRow } = require('./validators')
const { daysFromString, timeDiff, firstDayAfterDate, flipName } = require('./helpers')
const path = require('path')
const pug = require('pug')

// See: https://momentjs.com/docs/#/use-it/node-js/
moment().format()

// See: https://github.com/moment/moment/issues/3488
moment.suppressDeprecationWarnings = true;

async function makeSite(outputDir) {

  // Get the files json file in the directory
  const files = await fs.readdir(outputDir)

  const [index] = files.filter(file => path.extname(file) === '.json') 

  if (!index) {
    throw new Error('No index file found')
  }

  // Get the file contents of index json
  const json = await fs.readFile(path.join(outputDir, index))

  // If the index file exists, create the file using the template
  const compiledFunction = pug.compileFile(path.join(process.cwd(), 'src', 'templates', 'report.pug'))

  const html = compiledFunction({ results: json })

  // Write index.html to the output directory
  await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8')

}

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
  const debugMessage = (message) => {
    if (!argv.verbose) return
    console.debug(
      typeof message === 'string' ? message : JSON.stringify(message)
    )
  }

  /**
   * Reads a CSV file from disk
   * @param {string} filepath - The path to the csv
   * @returns {Promise<string>} - The contents of the file
   */
  async function readCsv(filepath) {
    try {
      return await fs.readFile(filepath, 'utf8')
    } catch (e) {
      return e
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
  async function createIcsEvent({ title, subject, course, section, instructor, email, days, times, fromDate, toDate }) {

    const daysArr = daysFromString(days)

    const rrule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: daysArr.map(day => {
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
      }).filter(day => day),
      until: new Date(toDate)
    })

    const firstDay = firstDayAfterDate(fromDate, days, times, moment)

    const start = firstDay.format('YYYY-M-D-H-m').split("-")

    const duration = timeDiff(times)

    // rrule.toString() will include the beginning RRULE:
    // This is not needed with the ics library
    // This line of code splits the returned rrule string at RRULE: and assigns the
    // second part (the part we need) to a variable.
    const [, recurrenceRule] = rrule.toString().split('RRULE:')

    const eventTitle = `${subject} ${course} ${section}`

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
    }

    return new Promise((resolve, reject) => {
      ics.createEvent(event, (err, val) => {
        if (err) reject(err)
        resolve(val)
      })
    })

  }

  /**
   * Writes an ics file to disk
   * @param {string} icsData - The generated ics data 
   * @param {string} fileName - The full file name to save
   * @returns {Promise<string>} - Returns a promise that will resolve with the created filename
   */
  async function writeIcsToDisk(icsData, fileName) {
    try {
      await fs.writeFile(fileName, icsData)
      return fileName
    } catch (e) {
      return e
    }
  }

  /**
   * Runs the parser
   * @return {Promise<{ title: string; subject: string; course: string; section: string; instructor: string; email: string; days: string; times: string; fromDate: any; toDate: any; filename: string; }[]>} - Returns a promise that resolves with the created files
   */
  async function runParser() {

    return new Promise((resolve, reject) => {

      Papa.parse(csv, {
        complete: async results => {

          // keep track of the created files, along with the source row
          let created = []

          // Get the rows from papa parse
          const rows = results.data.slice(1)

          if (rows.length === 0) {
            reject('No rows could be parsed from csv')
          }

          let i = 0

          for await (let r of rows) {

            try {
              debugMessage('-------------------------------------------')
              debugMessage(`Processing row ${i}`)
              debugMessage(r)

              // validate the row
              const row = await validateRow(r)

              const [title, subject, course, instr1, instr2, email1, email2, days1, days2, time1, time2, section] = row

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
              })

              // Set the file name
              const fn1 = `${title.replace(/[/\\?%*:|"<>\s]/g, '-')}__${section}_${days1.replace(/,/g, '')}__${time1.replace(/[:-\s]/g, '')}`
              const ext = '.ics'

              const fp1 = path.join(outputDir, fn1 + ext)
              const f1 = await writeIcsToDisk(ics1, fp1)
              debugMessage('Created' + ' ' + f1)

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
                filename: path.basename(f1)
              })

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
                })
                const fn2 = `${title.replace(/[/\\?%*:|"<>\s]/g, '-')}__${section}_${days2.replace(/,/g, '')}__${time2.replace(/[:-\s]/g, '')}`
                const fp2 = path.join(outputDir, fn2 + ext)
                const f2 = await writeIcsToDisk(ics2, fp2)
                debugMessage('Created' + ' ' + f2)

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
                  filename: path.basename(f2)
                })
              }

            } catch (e) {
              debugMessage(e)
            } finally {
              i++
            }

          }

          // once everything is done processing, create the index json file
          await fs.writeFile(outputDir + '/' + 'index.json', JSON.stringify(created), 'utf8')

          debugMessage('Done!')

          resolve(created)

        }
      })

    })

  }

  // Validate the arguments
  const args = await validateArgs(argv)

  // Set the output directory based on the arguments provided
  const outputDir = path.normalize(args.outputDir)

  // Read the CSV
  const csv = await readCsv(path.normalize(args.inputFile))

  return runParser()

}

module.exports = { parse, makeSite }