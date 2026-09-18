import fs from 'node:fs/promises';
await fs.mkdir('dist-pages/data',{recursive:true});
const snapshot=JSON.parse(await fs.readFile('data/menus.json','utf8'));
if(snapshot.schemaVersion!==1||!Array.isArray(snapshot.menus))throw Error('Invalid menu snapshot');
await fs.copyFile('data/menus.json','dist-pages/data/menus.json');
await fs.copyFile('public/favicon.svg','dist-pages/favicon.svg');
await fs.writeFile('dist-pages/.nojekyll','');
const domain=(await fs.readFile('CNAME','utf8')).trim();
if(!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain))throw Error('Invalid custom domain');
await fs.writeFile('dist-pages/CNAME',domain+'\n');
// Configure the real domain in GitHub Pages settings; relative paths work on both origins.
console.log('Static Pages bundle ready in dist-pages.');
