# csv2ics

This script will transform a csv file into a number of ics events.

## Work in progress warning

This repo is a work in progress

## Usage

```
NAME
    node-xls2ics
    
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

```