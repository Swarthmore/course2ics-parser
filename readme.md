# course2ics-parser

This package has 2 main functionalities

1. Transform a CSV into a number of ics events
2. Generate an `index.html` file that can be used to search through the generated events.

## Usage

### Installation
```
npm i course2ics-parser
```

#### Quick start
```javascript
const { parse, makeSite } = require('course2ics-parser')

(async () => {

    // Parse the CSV file into ics events. CSV format MUST be in the format as listed in docs.
    await parse({ 
        inputFile: 'some/path/to/report.csv', 
        outputDir: 'some/path/to/output/dir', 
        fromDate: '12/01/2020', 
        toDate: '12/31/2020',
        verbose: false
    })

    // Generate a site to allow users to search through the ics files
    makeSite('some/path/to/output/dir')

})()
```

### CSV Format
```
CSV FORMAT
    The input csv MUST be in the following format
    
    TITLE, SUBJ, CRSE, INSTR1, INSTR2, INSTR1_EMAIL, INSTR2_EMAIL, DAYS1, DAYS2, TIME1, TIME2, SEQ_NUMBER 

    TITLE           The title of the event
    SUBJ            The course subject
    CRSE            The course number
    INSTR1          The full name of the primary instructor, in the format Last, First
    INSTR2          The full name of the secondary instructor, in the format Last, First
                    This field may also be blank
    INSTR1_EMAIL    The email address of the primary instructor
    INSTR2_EMAIL    The email address of the secondary instructor
    DAYS1           A comma delimited set of days when the event happens.
                    M = Monday, T = Tuesday, W = Wednesday, R = Thursday, F = Friday, S = Saturday, U = Sunday
    DAYS2           A comma delimited set of days when the event happens. This second set is optional
    TIME1           The time for when the events defined in DAYS1 occur, in the format of HH-DD (24 hours)
    TIME2           The time for when the events defined in DAYS2 occur, in the format of HH-DD (24 hours)
    SEQ_NUMBER      The section for a course
```