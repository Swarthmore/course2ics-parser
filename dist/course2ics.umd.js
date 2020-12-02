#!/usr/bin/env node
!function(e){"function"==typeof define&&define.amd?define(e):e()}(function(){var e=require("rrule").RRule,r=require("yargs/yargs"),n=require("yargs/helpers").hideBin,t=require("fs").promises,i=r(n(process.argv)).argv,o=require("papaparse"),s=require("ics"),a=require("moment"),u=require("./validators"),c=u.validateArgs,f=u.validateRow,h=require("./helpers"),m=h.daysFromString,l=h.timeDiff,d=h.firstDayAfterDate;a().format(),a.suppressDeprecationWarnings=!0,i.docs&&(console.log("\n        NAME\n            course2ics\n            \n        DESCRIPTION\n            Generate an iCalendar (.ics) files from a csv.\n            \n            The following options are available:\n            \n            --input     REQUIRED. The path to the input csv. \n            \n            --from      REQUIRED. The starting date. Must be in ISO format YYYY-MM-DD. \n            \n            --to        REQUIRED. The ending date. Must be in ISO format YYYY-MM-DD.\n\n            --verbose   Run with verbose output.\n        \n            --docs      View the help docs (You're reading them! 🚀)\n        \n        \n        CSV FORMAT\n            The input csv MUST be in the following format\n            \n            TITLE, SUBJ, CRSE, INSTR1, INSTR2, INSTR1_EMAIL, INSTR2_EMAIL, DAYS1, DAYS2, TIME1, TIME2\n\n            TITLE           The title of the event\n            SUBJ            The course subject\n            CRSE            The course number\n            INSTR1          The full name of the primary instructor, in the format Last, First\n            INSTR2          The full name of the secondary instructor, in the format Last, First\n                            This field may also be blank\n            INSTR1_EMAIL    The email address of the primary instructor\n            INSTR2_EMAIL    The email address of the secondary instructor\n            DAYS1           A comma delimited set of days when the event happens.\n                            M = Monday, T = Tuesday, W = Wednesday, Th = Thursday, F = Friday, S = Saturday, Su = Sunday\n                            Ex: M,T,W,Th,F\n            DAYS2           A comma delimited set of days when the event happens. This second set is optional.\n            TIME1           The time for when the events defined in DAYS1 occur, in the format of HH-DD (24 hours)\n            TIME2           The time for when the events defined in DAYS2 occur, in the format of HH-DD (24 hours)\n            \n        EXAMPLE USAGE\n            node src/index.js --input=/path/to/input.csv --from=2020-01-01 --to=2020-03-01 \n        \n        CAVEATS\n            Files will be saved to PROJECT_ROOT/output. This means the output folder must be created before usage.\n            \n    "),process.exit());var T=function(e){i.verbose&&console.debug("string"==typeof e?e:JSON.stringify(e))};!function(){try{Promise.resolve(function(r){try{c(r);var n=__dirname+"/"+r.input;return Promise.resolve(t.readFile(n,"utf8")).then(function(n){o.parse(n,{complete:function(n){return function(n){n.data.slice(1).forEach(function(n){try{return Promise.resolve(function(n){try{if(!f(n))return Promise.resolve();var i=n[0],o=n[1],u=n[2],c=n[3],h=n[5],p=n[8],v=n[9],S=n[10],E=function(n,c,f,h){try{try{var T=m(f),p=new e({freq:e.WEEKLY,byweekday:T.map(function(r){switch(r){case"U":return e.SU;case"M":return e.MO;case"T":return e.TU;case"W":return e.WE;case"R":return e.TH;case"F":return e.FR;case"S":return e.SA}}).filter(function(e){return e}),until:new Date(r.to)}),v=d(r.from,f,h,a);if(!v)return Promise.resolve();var S=v.format("YYYY-M-D-H-m").split("-"),E=l(h),y=p.toString().split("RRULE:"),R=s.createEvent({start:S,duration:E,recurrenceRule:y[1],title:""+o+u,description:i,status:"CONFIRMED",organizer:{name:n,email:c}},function(e,r){try{if(e)throw e;var n="output/"+S.join("-")+"_"+f.replace(/,/g,"")+"_"+h.replace(/[:-\s]/g,"")+"_"+o+"-"+u+".ics";return Promise.resolve(t.writeFile(n,r)).then(function(){return n})}catch(e){return Promise.reject(e)}});return Promise.resolve(R)}catch(e){throw e}}catch(e){return Promise.reject(e)}};return Promise.resolve(E(c,h,n[7],v)).then(function(e){T("Writing event for "+v),T("Wrote new ics to disk");var r=function(){if(p&&S)return Promise.resolve(E(c,h,p,S)).then(function(e){T("Writing event for "+S),T("Wrote new ics to disk")})}();if(r&&r.then)return r.then(function(){})})}catch(e){return Promise.reject(e)}}(n)).then(function(){})}catch(e){return Promise.reject(e)}})}(n)}})})}catch(e){return Promise.reject(e)}}(i)).then(function(){return 0})}catch(e){Promise.reject(e)}}()});
//# sourceMappingURL=course2ics.umd.js.map
