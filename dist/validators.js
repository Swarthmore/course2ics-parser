exports.validateArgs=i=>new Promise((s,t)=>{i.inputFile||t("--input is missing"),i.fromDate||t("--from is missing"),i.toDate||t("--to is missing"),i.outputDir||t("--output is missing"),s(i)}),exports.validateRow=i=>new Promise((s,t)=>{const[m,n,e,o,g,a,r,p,u,l,D,w]=i;m||t("Title is missing"),a||t("Email1 is missing"),p||t("Days1 is missing"),l||t("Time1 is missing"),w||t("Section is missing"),s(i)});
//# sourceMappingURL=validators.js.map
