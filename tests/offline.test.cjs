const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const worker = fs.readFileSync(path.join(__dirname,'../src/main/resources/static/sw.js'),'utf8');
function harness(scope='https://example.test/TikGame/') {
  const listeners={}, stores=new Map(),requests=[];let online=true,claimed=0,skipped=0;
  async function fetch(request) { const url=typeof request==='string'?request:request.url;requests.push(url);if(!online)throw Error('offline');return new Response('cached '+new URL(url).pathname,{status:200}); }
  const caches={
    async open(name){if(!stores.has(name))stores.set(name,new Map());const values=stores.get(name);return {
      async addAll(items){const pending=[];for(const item of items){const response=await fetch(item);if(!response.ok)throw Error('bad asset');pending.push([item.url,response]);}for(const [key,value]of pending)values.set(key,value);},
      async match(key){const item=values.get(typeof key==='string'?key:key.url);return item?.clone();}
    };},async keys(){return [...stores.keys()];},async delete(key){return stores.delete(key);}
  };
  const self={registration:{scope},clients:{async claim(){claimed++;}},async skipWaiting(){skipped++;},addEventListener(name,callback){listeners[name]=callback;}};
  vm.runInNewContext(worker,{self,caches,fetch,Request,Response,URL,Set});
  return {stores,requests,listeners,setOffline(){online=false;},get claimed(){return claimed;},get skipped(){return skipped;},
    async trigger(name,data={}){let promise;listeners[name]({...data,waitUntil(value){promise=value;}});await promise;},
    async request(url,options={}){let response;listeners.fetch({request:new Request(url,options),respondWith(value){response=value;}});return response?await response:null;}
  };
}
test('precache respects the GitHub project prefix, with no origin-root leakage',async()=>{
  const h=harness();await h.trigger('install');assert.ok(h.requests.length>=12);assert.ok(h.requests.every(url=>url.startsWith('https://example.test/TikGame/')));assert.equal(h.skipped,0);
});
test('shell, privacy and query-string navigation work when the network is gone',async()=>{
  const h=harness();await h.trigger('install');await h.trigger('activate');h.setOffline();
  for(const file of ['?launch=homescreen','app.js','growth.js','styles.css','manifest.webmanifest','privacy.html']){
    const response=await h.request('https://example.test/TikGame/'+file);assert.equal(response.status,200);assert.match(await response.text(),/cached \/TikGame\//);
  }
});
test('activation deletes only this project’s old caches',async()=>{
  const h=harness();h.stores.set('other-app-cache',new Map());h.stores.set('loop-shell:%2FOtherProject%2F:old',new Map());h.stores.set('loop-shell:%2FTikGame%2F:old',new Map());await h.trigger('install');await h.trigger('activate');assert.ok(h.stores.has('other-app-cache'));assert.ok(h.stores.has('loop-shell:%2FOtherProject%2F:old'));assert.ok(!h.stores.has('loop-shell:%2FTikGame%2F:old'));assert.equal(h.claimed,1);
});
test('worker ignores unrelated websites, sibling projects, APIs and non-GET requests',async()=>{
  const h=harness();await h.trigger('install');h.setOffline();
  for(const url of ['https://elsewhere.test/TikGame/app.js','https://example.test/OtherProject/app.js','https://example.test/TikGame/api/health','https://example.test/TikGame-other/app.js'])assert.equal(await h.request(url),null);
  assert.equal(await h.request('https://example.test/TikGame/',{method:'POST'}),null);
});
test('an uncached shell request fails cleanly instead of returning undefined',async()=>{
  const h=harness();h.setOffline();assert.equal((await h.request('https://example.test/TikGame/app.js')).status,503);
});
test('updates skip waiting only after the explicit UI message',async()=>{
  const h=harness();await h.trigger('install');assert.equal(h.skipped,0);await h.trigger('message',{data:{type:'unrelated'}});assert.equal(h.skipped,0);await h.trigger('message',{data:{type:'SKIP_WAITING'}});assert.equal(h.skipped,1);
});
test('manifest and social preview are deployable at root and under /TikGame/',()=>{
  const staticDir=path.join(__dirname,'../src/main/resources/static');
  const manifest=JSON.parse(fs.readFileSync(path.join(staticDir,'manifest.webmanifest'),'utf8'));
  for(const base of ['https://example.test/','https://example.test/TikGame/']){
    assert.equal(new URL(manifest.start_url,base).href,base);assert.equal(new URL(manifest.scope,base).href,base);
    for(const icon of manifest.icons)assert.ok(new URL(icon.src,base).href.startsWith(base));
  }
  for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(staticDir,icon.src)));
  const png=fs.readFileSync(path.join(staticDir,'social-preview.png'));assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
  const html=fs.readFileSync(path.join(staticDir,'index.html'),'utf8');assert.match(html,/https:\/\/thomas-nejad.github.io\/TikGame\/social-preview.png/);assert.match(html,/href="privacy.html"/);
});
