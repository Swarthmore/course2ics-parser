!function(e){"function"==typeof define&&define.amd?define(e):e()}(function(){const e=e=>{const t=e.split("-");return{from:t[0].trim(),to:t[1].trim()}},t=e=>{let t,r,n,o;return o=Math.floor(e/1e3),n=Math.floor(o/60),o%=60,r=Math.floor(n/60),n%=60,t=Math.floor(r/24),r%=24,{days:t,hours:r,minutes:n,seconds:o}},r=e=>{switch(e){case"U":return 0;case"M":return 1;case"T":return 2;case"W":return 3;case"R":return 4;case"F":return 5;case"S":return 6;default:throw new Error("Invalid day given")}},n=e=>e.split(",");module.exports={convertMS:t,firstDayAfterDate:(t,o,a,u)=>{try{const[s]=n(o),c=r(s),{from:i}=e(a),[f,d]=i.split(":"),m=u(t);m.set("hour",f),m.set("minute",d);let h=u(m);do{h=h.add(1,"days")}while(h.day()!==c);return h}catch(e){throw e}},daysFromString:n,dayToNum:r,timeDiff:r=>{const{from:n,to:o}=e(r),[a,u]=n.split(":"),[s,c]=o.split(":"),i=new Date(2e3,0,1,a,u),f=new Date(2e3,0,1,s,c);return f<i&&f.setDate(f.getDate()+1),t(f-i)},timeFromString:e,flipName:e=>{const t=e.split(",");return`${t[1].trim()} ${t[0].trim()}`}}});
//# sourceMappingURL=helpers.umd.js.map
