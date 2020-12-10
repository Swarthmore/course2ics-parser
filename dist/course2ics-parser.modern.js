const{RRule:e}=require("rrule"),t=require("fs").promises,r=require("papaparse"),a=require("ics"),i=require("moment"),{validateArgs:n,validateRow:s}=require("./validators"),{daysFromString:o,timeDiff:c,firstDayAfterDate:u,flipName:l}=require("./helpers"),f=require("path");i().format(),i.suppressDeprecationWarnings=!0,module.exports={parse:async function(m){const y=e=>{m.verbose&&console.debug("string"==typeof e?e:JSON.stringify(e))};async function w({title:t,subject:r,course:n,section:s,instructor:f,email:m,days:y,times:w,fromDate:d,toDate:D}){const b=o(y),p=new e({freq:e.WEEKLY,byweekday:b.map(t=>{switch(t){case"U":return e.SU;case"M":return e.MO;case"T":return e.TU;case"W":return e.WE;case"R":return e.TH;case"F":return e.FR;case"S":return e.SA}}).filter(e=>e),until:new Date(D)}),g=u(d,y,w,i).format("YYYY-M-D-H-m").split("-"),$=c(w),[,_]=p.toString().split("RRULE:"),h={start:g,duration:$,recurrenceRule:_,title:`${r} ${n} ${s}`,description:t,status:"CONFIRMED",organizer:{name:l(f),email:m}};return new Promise((e,t)=>{a.createEvent(h,(r,a)=>{r&&t(r),e(a)})})}async function d(e,r){try{return await t.writeFile(r,e),r}catch(e){return e}}const D=await n(m),b=f.normalize(D.outputDir),p=await async function(e){try{return await t.readFile(e,"utf8")}catch(e){return e}}(f.normalize(D.inputFile));return async function(){return new Promise((e,a)=>{r.parse(p,{complete:async r=>{let i=[];const n=r.data.slice(1);0===n.length&&a("No rows could be parsed from csv");let o=0;var c,u=!0,l=!1;try{for(var m,p,g=function(e){var t;if("undefined"!=typeof Symbol){if(Symbol.asyncIterator&&null!=(t=e[Symbol.asyncIterator]))return t.call(e);if(Symbol.iterator&&null!=(t=e[Symbol.iterator]))return t.call(e)}throw new TypeError("Object is not async iterable")}(n);u=(m=await g.next()).done,p=await m.value,!u;u=!0){let e=p;try{y("-------------------------------------------"),y("Processing row "+o),y(e);const t=await s(e),[r,a,n,c,u,l,m,p,g,$,_,h]=t,q=await w({title:r,subject:a,course:n,section:h,instructor:c,email:l,days:p,times:$,fromDate:D.fromDate,toDate:D.toDate}),S=`${r.replace(/[/\\?%*:|"<>\s]/g,"-")}__${h}_${p.replace(/,/g,"")}__${$.replace(/[:-\s]/g,"")}`,R=".ics",j=f.join(b,S+R),v=await d(q,j);if(y("Created "+v),i.push({title:r,subject:a,course:n,section:h,instructor:c,email:l,days:p,times:$,fromDate:D.fromDate,toDate:D.toDate,filename:v}),g&&_){const e=await w({title:r,subject:a,course:n,section:h,instructor:c,email:l,days:g,times:_,fromDate:D.fromDate,toDate:D.toDate}),t=`${r.replace(/[/\\?%*:|"<>\s]/g,"-")}__${h}_${g.replace(/,/g,"")}__${_.replace(/[:-\s]/g,"")}`,s=f.join(b,t+R),o=await d(e,s);y("Created "+o),i.push({title:r,subject:a,course:n,section:h,instructor:c,email:l,days:g,times:_,fromDate:D.fromDate,toDate:D.toDate,filename:o})}}catch(e){y(e)}finally{o++}}}catch(e){l=!0,c=e}finally{try{u||null==g.return||await g.return()}finally{if(l)throw c}}await t.writeFile(b+"/index.json",JSON.stringify(i),"utf8"),y("Done!"),e(i)}})})}()}};
//# sourceMappingURL=course2ics-parser.modern.js.map
