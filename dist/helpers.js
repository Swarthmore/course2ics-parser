const t=t=>{const e=t.split("-");return{from:e[0].trim(),to:e[1].trim()}},e=t=>{let e,r,n,a;return a=Math.floor(t/1e3),n=Math.floor(a/60),a%=60,r=Math.floor(n/60),n%=60,e=Math.floor(r/24),r%=24,{days:e,hours:r,minutes:n,seconds:a}},r=t=>{switch(t){case"U":return 0;case"M":return 1;case"T":return 2;case"W":return 3;case"R":return 4;case"F":return 5;case"S":return 6;default:throw new Error("Invalid day given")}},n=t=>t.split(",");module.exports={convertMS:e,firstDayAfterDate:(e,a,o,s)=>{try{const[u]=n(a),c=r(u),{from:i}=t(o),[m,h]=i.split(":"),d=s(e);d.set("hour",m),d.set("minute",h);let f=s(d);do{f=f.add(1,"days")}while(f.day()!==c);return f}catch(t){throw t}},daysFromString:n,dayToNum:r,timeDiff:r=>{const{from:n,to:a}=t(r),[o,s]=n.split(":"),[u,c]=a.split(":"),i=new Date(2e3,0,1,o,s),m=new Date(2e3,0,1,u,c);return m<i&&m.setDate(m.getDate()+1),e(m-i)},timeFromString:t,flipName:t=>{const e=t.split(",");return`${e[1].trim()} ${e[0].trim()}`}};
//# sourceMappingURL=helpers.js.map
