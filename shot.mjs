import { chromium } from 'playwright';
const base = process.argv[2] || 'https://www.orchardads.in';
const pages = [['landing','/'],['product','/product'],['signin','/signin'],['pricing','/pricing'],['onboarding','/onboarding']];
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
for (const [name, path] of pages) {
  await pg.goto(base+path, { waitUntil:'networkidle', timeout:30000 }).catch(()=>{});
  await pg.screenshot({ path:`/tmp/shots/${name}.png`, fullPage:true });
  console.log('shot', name);
}
await b.close();
