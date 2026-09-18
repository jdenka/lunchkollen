import fs from 'node:fs/promises';
import { collect, fingerprint, type Snapshot } from './menu-snapshot';
let previous:Snapshot|undefined;
try{previous=JSON.parse(await fs.readFile('data/menus.json','utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
const snapshot=await collect(previous),hash=fingerprint(snapshot);
await fs.mkdir('data',{recursive:true});
await fs.writeFile('data/menus.json.tmp',JSON.stringify(snapshot,null,2)+'\n');await fs.rename('data/menus.json.tmp','data/menus.json');
let published='';try{published=(await fs.readFile('data/published.sha256','utf8')).trim();}catch{}
const changed=hash!==published;
if(process.env.GITHUB_OUTPUT)await fs.appendFile(process.env.GITHUB_OUTPUT,`changed=${changed}\nfingerprint=${hash}\n`);
const failures=snapshot.menus.filter(m=>m.fetchFailed).map(m=>m.id);
console.log(`Checked ${snapshot.menus.length} restaurants. ${failures.length} failures. Publication needed: ${changed}.`);
if(failures.length)console.log('::warning::Could not refresh: '+failures.join(', ')+'. Last valid menus retained where available.');
if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,`## Menykontroll\n\nKontrollerad: ${snapshot.checkedAt}\n\n${snapshot.menus.length-failures.length}/${snapshot.menus.length} hämtningar lyckades.\n\n${failures.length?'Kunde inte hämta: '+failures.join(', '):'Alla restauranger svarade.'}\n`);
