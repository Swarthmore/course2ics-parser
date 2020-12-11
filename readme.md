# course2ics-parser

This script will transform a csv file into a number of ics events.

## Work in progress warning

This repo is a work in progress

## Usage

### Installation
```
npm i course2ics-parser
```

#### Quick start
```javascript
const { parse, makeSite } = require('course2ics-parser')

(async () => {

    await parse({ 
        inputFile: 'some/path/to/report.csv', 
        outputDir: 'some/path/to/output/dir', 
        fromDate: '12/01/2020', 
        toDate: '12/31/2020',
        verbose: false,
        makeSite: true
    })

    // You can also generate a static website that will allow users
    // to search through the created files. This will generate an index.html
    // file in the specified output directory
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