import { chromium } from 'playwright';
const base='https://www.orchardads.in';
const pages=[['landing','/'],['product','/product'],['pricing','/pricing'],['signin','/signin'],['tool-waste','/tools/waste-finder'],['tools-index','/tools'],['dashboard','/dashboard']];
const b=await chromium.launch();
const pg=await b.newPage({viewport:{width:1280,height:900}});
for(const [n,p] of pages){ await pg.goto(base+p,{waitUntil:'networkidle',timeout:30000}).catch(()=>{}); await pg.screenshot({path:`/tmp/shots/${n}.png`,fullPage:true}); console.log('shot',n); }
await b.close();
