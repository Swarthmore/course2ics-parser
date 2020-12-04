/**
 * Validates script arguments. It will throw an error if a required argument is not provided.
 * @param {*} argv 
 * @returns void 
 */
exports.validateArgs = (argv) => {

  if (!argv.input) {
    throw new Error('--input is missing')
  }

  if (!argv.from) {
    throw new Error('--from is missing')
  }

  if (!argv.to) {
    throw new Error('--to is missing')
  }

  if (!argv.output) {
      throw new Error('--output is missing')
  }
}

/**
 * Validates row data
 *  
 * @param  row 
 * @returns Boolean - Returns true if the row is valid or false if it is not
 */
exports.validateRow = (row) => {
  let valid = true

  const [title, subject, course, instr1, instr2, email1, email2, days1, days2, time1, time2, section] = row

  if (!title) {
    valid = false
  }

  if (!email1) {
    valid = false
  }

  if (!days1) {
    valid = false
  }

  if (!time1) {
    valid = false
  }

  if (!section) {
    valid = false
  }

  return valid

}

