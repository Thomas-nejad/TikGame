/* One source of truth: publish the tested frontend into GitHub Pages' /docs folder. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'src/main/resources/static');
const destination = path.join(root, 'docs');
const files = ['index.html','styles.css','app.js','growth.js','growth.css','privacy.html','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','icon-maskable-512.png','social-preview.png'];
const hash = crypto.createHash('sha256');
for (const file of files) { hash.update(file); hash.update(fs.readFileSync(path.join(source,file))); }
let worker = fs.readFileSync(path.join(source, 'sw.js'), 'utf8');
hash.update(worker.replace(/const VERSION = '[^']+';/, "const VERSION = '__LOOP_BUILD__';"));
const version = hash.digest('hex').slice(0,16);
worker = worker.replace(/const VERSION = '[^']+';/, `const VERSION = '${version}';`);
fs.writeFileSync(path.join(source,'sw.js'), worker);
fs.mkdirSync(destination, {recursive:true});
for (const file of files) fs.copyFileSync(path.join(source,file),path.join(destination,file));
fs.writeFileSync(path.join(destination,'sw.js'),worker);
fs.writeFileSync(path.join(destination,'.nojekyll'),'');
console.log(`Pages ready: docs/ · build ${version}`);
