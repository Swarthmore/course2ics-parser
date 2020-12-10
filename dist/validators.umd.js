(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () {
  /**
   * Validates script arguments. It will throw an error if a required argument is not provided.
   * @param {*} argv 
   * @returns {Promise<*>} - Returns a promise that resolves in the provided arguments
   */
  exports.validateArgs = argv => new Promise((resolve, reject) => {
    if (!argv.inputFile) {
      reject('--input is missing');
    }

    if (!argv.fromDate) {
      reject('--from is missing');
    }

    if (!argv.toDate) {
      reject('--to is missing');
    }

    if (!argv.outputDir) {
      reject('--output is missing');
    }

    resolve(argv);
  });
  /**
   * Validates row data
   * @param {string[]} row - The row to validate
   * @returns {Promise<string[]>} - Returns a promise that resolves with the provided row
   */


  exports.validateRow = row => new Promise((resolve, reject) => {
    const [title, subject, course, instr1, instr2, email1, email2, days1, days2, time1, time2, section] = row;

    if (!title) {
      reject('Title is missing');
    }

    if (!email1) {
      reject('Email1 is missing');
    }

    if (!days1) {
      reject('Days1 is missing');
    }

    if (!time1) {
      reject('Time1 is missing');
    }

    if (!section) {
      reject('Section is missing');
    }

    resolve(row);
  });

})));
//# sourceMappingURL=validators.umd.js.map
