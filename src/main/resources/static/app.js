(function (root) {
  'use strict';
  const rules = {
    nextIndex(index, direction, count) {
      if (!Number.isInteger(count) || count < 1) return 0;
      return ((index + direction) % count + count) % count;
    },
    stackOverlap(previous, moving) {
      const left = Math.max(previous.x, moving.x);
      const right = Math.min(previous.x + previous.width, moving.x + moving.width);
      return { x: left, width: Math.max(0, right - left) };
    },
    rectanglesOverlap(a, b) {
      return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    },
    angularDistance(a, b) { return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))); }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = rules;
  else root.ArcadeRules = rules;
})(typeof globalThis !== 'undefined' ? globalThis : this);

'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const games = [
  {id:'stack', title:'Stack Attack', category:'TIMING', kicker:'ONE TAP. SKY HIGH.', description:'Drop each block. Build your way to the top.', hint:'Tap Drop or press Space. Perfect landings keep your width.', color:'#d4fa74', background:'#3d4b30', icon:'▰', type:'canvas'},
  {id:'orbit', title:'Orbit Pop', category:'PRECISION', kicker:'FIND YOUR MOMENT.', description:'Tap when the comet reaches the glowing zone.', hint:'Tap anywhere in the arena or press Space. Three misses ends the run.', color:'#c3a6ff', background:'#403259', icon:'◉', type:'canvas'},
  {id:'lane', title:'Neon Drift', category:'ARCADE', kicker:'SMALL CAR. BIG ESCAPE.', description:'Switch lanes. Dodge the blocks. Keep your cool.', hint:'Use ← →, the buttons, or tap either half of the arena.', color:'#79d6ff', background:'#234858', icon:'⌁', type:'canvas'},
  {id:'tap', title:'Tap Rush', category:'REFLEX', kicker:'QUICK HANDS CLUB.', description:'Find the spark. Hit as many as you can in 15 seconds.', hint:'Tap the glowing tile. A new spark appears after every hit.', color:'#ffa6c5', background:'#573547', icon:'✳'},
  {id:'memory', title:'Match Club', category:'MEMORY', kicker:'A LITTLE BRAIN FLEX.', description:'Eight cards. Four pairs. How few moves can you make?', hint:'Tap two cards to reveal them. Fewer moves is better.', color:'#ffcc7a', background:'#51412e', icon:'◈', lower:true},
  {id:'color', title:'Color Clash', category:'FOCUS', kicker:'YOUR BRAIN HAS ENTERED THE CHAT.', description:'Pick the ink colour. Ignore what the word says.', hint:'20 seconds. Correct +1. Wrong −1. Trust your eyes.', color:'#8de7c3', background:'#285344', icon:'Aa'}
];
let progress = {};
try {
  const raw = JSON.parse(localStorage.getItem('loop-progress'));
  for (const game of games) {
    const item = raw?.[game.id];
    progress[game.id] = {saved:item?.saved === true, best:game.id==='memory' && item?.rulesVersion!==2 ? null : Number.isFinite(item?.best) && item.best >= 0 ? item.best : null, rulesVersion:2, plays:Number.isInteger(item?.plays) && item.plays > 0 ? item.plays : 0};
  }
} catch { /* A blocked or corrupted store must not stop play. */ }
for (const game of games) progress[game.id] ||= {saved:false,best:null,plays:0};
let current = 0, controller, collectionView = 'library', toastTimer, lastNavigation = 0, wheelAmount = 0, wheelAt = 0;
const card = $('#game-card'), surface = $('#game-surface'), collectionDialog = $('#collection-dialog'), shareDialog = $('#share-dialog');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function persist() { try { localStorage.setItem('loop-progress',JSON.stringify(progress)); } catch { showToast('Browser storage is unavailable. This visit still works.'); } }
function showToast(message) { $('#toast').textContent=message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000); }
function formatBest(game) { const best=progress[game.id].best; return best == null ? 'No score yet' : `${best} ${game.lower?'moves':'points'}`; }
function refreshProgress() {
  const game=games[current], entry=progress[game.id];
  $('#personal-best').textContent=entry.best == null ? 'Your next personal best awaits' : 'Personal best · '+formatBest(game);
  $('#saved-count').textContent=games.filter(g=>progress[g.id].saved).length;
  $('#save-game').setAttribute('aria-pressed',String(entry.saved));
  $('#save-game').innerHTML=entry.saved?'♥ <span>Saved</span>':'♡ <span>Save</span>';
  $('#save-game').setAttribute('aria-label',(entry.saved?'Unsave ':'Save ')+game.title);
}
function goTo(index, force = false) {
  if (!force && index===current && controller) return;
  controller?.destroy(); current=ArcadeRules.nextIndex(index,0,games.length);lastNavigation=performance.now();wheelAmount=0;
  const game=games[current];
  card.style.setProperty('--accent',game.color);card.style.setProperty('--card',game.background);card.dataset.game=game.id;
  $('#game-category').textContent=game.category;$('#game-edition').textContent=`${String(current+1).padStart(2,'0')} / 06`;
  $('#game-kicker').textContent=game.kicker;$('#game-title').textContent=game.title;$('#game-description').textContent=game.description;$('#game-control-hint').textContent=game.hint;
  card.setAttribute('aria-label',game.title+' game'); $('#pause-banner').hidden=true;
  card.classList.remove('switching');if(!reduceMotion)requestAnimationFrame(()=>card.classList.add('switching'));
  surface.replaceChildren();
  controller=game.type==='canvas'?createCanvasGame(game):game.id==='tap'?createTapGame(game):game.id==='memory'?createMemoryGame(game):createColorGame(game);
  refreshProgress();renderNext();renderDots();
}
function navigate(direction) { goTo(ArcadeRules.nextIndex(current,direction,games.length)); }
$('#next-game').onclick=()=>navigate(1);$('#previous-game').onclick=()=>navigate(-1);
function renderDots() {
  $('#feed-dots').replaceChildren(...games.map((game,index)=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-label','Play '+game.title);button.setAttribute('aria-current',String(index===current));button.onclick=()=>goTo(index);return button;}));
}
function miniArt(game) { const element=document.createElement('span');element.className='mini-art';element.style.setProperty('--mini',game.color);element.textContent=game.icon;return element; }
function renderNext() {
  $('#next-list').replaceChildren(...[1,2,3].map(offset=>{
    const index=ArcadeRules.nextIndex(current,offset,games.length),game=games[index],button=document.createElement('button');button.className='next-card';
    const text=document.createElement('span');const title=document.createElement('strong');title.textContent=game.title;const detail=document.createElement('small');detail.textContent=game.category.toLowerCase()+' · instant play';text.append(title,detail);
    const arrow=document.createElement('span');arrow.textContent='↗';button.append(miniArt(game),text,arrow);button.onclick=()=>goTo(index);return button;
  }));
}
// One mounted game, one animation loop. Moving past either end wraps without cloned DOM.
card.addEventListener('wheel',event=>{
  if(collectionDialog.open||shareDialog.open||event.ctrlKey)return;
  if(Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
  event.preventDefault();const now=performance.now();if(now-lastNavigation<650)return;
  if(now-wheelAt>180)wheelAmount=0;wheelAt=now;wheelAmount+=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?400:1);
  if(Math.abs(wheelAmount)>=65)navigate(wheelAmount>0?1:-1);
},{passive:false});
let swipe;
$$('.swipe-zone').forEach(zone=>{
  zone.addEventListener('touchstart',event=>{if(event.target.closest('button'))return;const touch=event.touches[0];swipe={x:touch.clientX,y:touch.clientY};},{passive:true});
  zone.addEventListener('touchend',event=>{if(!swipe)return;const touch=event.changedTouches[0],dy=touch.clientY-swipe.y,dx=touch.clientX-swipe.x;swipe=null;if(Math.abs(dy)>45&&Math.abs(dy)>Math.abs(dx))navigate(dy<0?1:-1);},{passive:true});
  zone.addEventListener('touchcancel',()=>{swipe=null;},{passive:true});
});
document.addEventListener('keydown',event=>{
  if(event.target.closest('input,textarea,[contenteditable=true]')||collectionDialog.open||shareDialog.open)return;
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();navigate(event.key==='ArrowDown'?1:-1);return;}
  if(event.key==='Escape'){controller?.pause();return;}
  if(event.code==='Space'&&event.target.closest('button'))return;
  if(['ArrowLeft','ArrowRight','Space'].includes(event.code)){event.preventDefault();if(!event.repeat)controller?.key(event.code);}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)controller?.pause();});
$('#resume-game').onclick=()=>controller?.resume();
$('#save-game').onclick=()=>{const entry=progress[games[current].id];entry.saved=!entry.saved;persist();refreshProgress();showToast(entry.saved?'Saved. Find it in your collection.':'Removed from saved games.');};
function openCollection(view, focusSearch=false) {
  controller?.pause();collectionView=view;$('#game-search').value='';$('#search-box').hidden=view==='records';$('#dialog-title').textContent=view==='saved'?'Saved for later':view==='records'?'Your personal bests':'Find your next favourite';
  renderCollection();if(!collectionDialog.open)collectionDialog.showModal();if(focusSearch)$('#game-search').focus();
}
function renderCollection() {
  const host=$('#collection-content');host.replaceChildren();
  if(collectionView==='records'){
    for(const game of games){const row=document.createElement('div');row.className='record-row';const text=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('small'),best=document.createElement('b');title.textContent=game.title;detail.textContent=progress[game.id].plays+' completed runs · '+(game.lower?'fewer moves wins':'higher score wins');best.textContent=progress[game.id].best??'—';text.append(title,detail);row.append(miniArt(game),text,best);host.append(row);}
    return;
  }
  const term=$('#game-search').value.trim().toLowerCase();const matches=games.filter(game=>(collectionView!=='saved'||progress[game.id].saved)&&(game.title+' '+game.category).toLowerCase().includes(term));
  if(!matches.length){const empty=document.createElement('div');empty.className='empty-state';empty.textContent=collectionView==='saved'?'Your collection starts with a heart. Save a game while you play.':'No games match that search. Try “timing” or “memory”.';host.append(empty);return;}
  const grid=document.createElement('div');grid.className='collection-grid';
  for(const game of matches){const button=document.createElement('button');button.className='collection-game';const title=document.createElement('strong'),category=document.createElement('small'),best=document.createElement('small');title.textContent=game.title;category.textContent=game.category;best.className='collection-best';best.textContent=formatBest(game);button.append(miniArt(game),title,category,best);button.onclick=()=>{collectionDialog.close();goTo(games.indexOf(game),true);};grid.append(button);}host.append(grid);
}
$$('[data-view]').forEach(button=>button.onclick=()=>{
  const view=button.dataset.view;
  if(view==='play'){collectionDialog.close();shareDialog.close();card.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'center'});controller?.resume();}
  else openCollection(view);
});
$('#close-dialog').onclick=()=>collectionDialog.close();$('#game-search').oninput=renderCollection;$('#open-search').onclick=()=>openCollection('library',true);
collectionDialog.addEventListener('click',event=>{if(event.target===collectionDialog){const r=collectionDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)collectionDialog.close();}});
function share() {
  controller?.pause();const game=games[current],url=new URL(location.pathname,location.origin),params=new URLSearchParams({game:game.id});if(progress[game.id].best!=null)params.set('score',progress[game.id].best);url.hash=params.toString();$('#share-link').value=url.href;$('#share-title').textContent='Challenge: '+game.title;shareDialog.showModal();
}
$('#share-game').onclick=share;$('#close-share').onclick=()=>shareDialog.close();$('#copy-share').onclick=async()=>{try{await navigator.clipboard.writeText($('#share-link').value);showToast('Challenge link copied. Your move, friend.');}catch{$('#share-link').select();showToast('Select and copy the link above.');}};
$('#daily-challenge').onclick=()=>goTo(Math.floor(Date.now()/86400000)%games.length);
$$('.brand').forEach(link=>link.onclick=event=>{event.preventDefault();goTo(0);});
function deepLink() {const params=new URLSearchParams(location.hash.slice(1)),id=params.get('game'),index=games.findIndex(game=>game.id===id);if(index<0)return false;goTo(index,true);const score=params.get('score');if(score&&/^\d{1,6}$/.test(score)){const banner=document.createElement('div');banner.className='challenge-banner';banner.textContent=`Friend challenge: ${score} ${games[index].lower?'moves or fewer':'points to beat'}. Ready?`;surface.prepend(banner);}return true;}
window.addEventListener('hashchange',deepLink);

// A controller owns all listeners, timers and animation frames for the mounted game.
function baseGame(game, markup) {
  surface.innerHTML=markup;
  const abort=new AbortController();let frame=0,last=0,elapsed=0,status='ready',score=0;
  const api={
    game, get status(){return status;}, get score(){return score;},get elapsed(){return elapsed;},
    on(target,event,handler){target.addEventListener(event,handler,{signal:abort.signal});},
    setScore(value){score=value;const label=$('[data-score]',surface);if(label)label.textContent=value;},
    setTime(value){const label=$('[data-time]',surface);if(label)label.textContent=value;},
    start(){if(status==='playing')return;surface.querySelector('.results')?.remove();status='playing';elapsed=0;last=0;score=0;api.setScore(0);$('#pause-banner').hidden=true;api.onStart?.();cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);},
    finish(message,customScore){if(status!=='playing')return;if(customScore!=null)api.setScore(customScore);status='over';cancelAnimationFrame(frame);const entry=progress[game.id],old=entry.best;const newBest=old==null||(game.lower?score<old:score>old);if(newBest)entry.best=score;entry.plays++;persist();refreshProgress();const result=document.createElement('div');result.className='results';result.innerHTML='<span class="result-kicker"></span><strong class="result-value"></strong><span class="result-message"></span><div class="result-buttons"><button class="primary replay">Play again ↻</button><button class="secondary challenge">Challenge ↗</button></div>';$('.result-kicker',result).textContent=newBest?'NEW PERSONAL BEST ✦':'NICE LITTLE RUN';$('.result-value',result).textContent=score;$('.result-message',result).textContent=message;$('.replay',result).onclick=()=>api.start();$('.challenge',result).onclick=share;surface.append(result);},
    pause(){if(status!=='playing')return;status='paused';cancelAnimationFrame(frame);$('#pause-banner').hidden=false;},
    resume(){if(status!=='paused'||document.hidden||collectionDialog.open||shareDialog.open)return;status='playing';last=0;$('#pause-banner').hidden=true;frame=requestAnimationFrame(tick);},
    key(code){if(status==='paused'){api.resume();return;}if(status==='ready'&&code==='Space'){api.start();return;}if(status==='playing')api.onKey?.(code);},
    destroy(){status='destroyed';cancelAnimationFrame(frame);abort.abort();api.onDestroy?.();$('#pause-banner').hidden=true;}
  };
  function tick(now){if(status!=='playing')return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;elapsed+=dt;api.onTick?.(dt);if(status==='playing')frame=requestAnimationFrame(tick);}
  return api;
}
const hud=(second='TIME')=>`<div class="game-hud"><span>SCORE <b data-score>0</b></span><span>${second} <b data-time>—</b></span></div>`;
function createTapGame(game) {
  const api=baseGame(game,hud()+'<div class="tap-board" aria-label="Tap Rush targets"></div><button class="primary game-start">Play Tap Rush →</button>');
  const board=$('.tap-board',surface),start=$('.game-start',surface);let target=-1;
  const cells=Array.from({length:9},(_,i)=>{const cell=document.createElement('button');cell.className='tap-cell';cell.setAttribute('aria-label','Target '+(i+1));cell.textContent='✳';api.on(cell,'click',()=>{if(api.status==='playing'&&i===target){api.setScore(api.score+1);next();}});board.append(cell);return cell;});
  function next(){cells.forEach(cell=>{cell.classList.remove('target');cell.setAttribute('aria-pressed','false');});target=(target+1+Math.floor(Math.random()*8))%9;cells[target].classList.add('target');cells[target].setAttribute('aria-pressed','true');}
  api.onStart=()=>{start.hidden=true;api.setTime(15);next();};api.onTick=()=>{api.setTime(Math.max(0,Math.ceil(15-api.elapsed)));if(api.elapsed>=15){cells.forEach(cell=>cell.classList.remove('target'));api.finish('sparks caught in 15 seconds');}};api.on(start,'click',()=>api.start());api.setTime(15);return api;
}
function createMemoryGame(game) {
  const api=baseGame(game,'<div class="game-hud"><span>MOVES <b data-score>0</b></span><span>PAIRS <b data-pairs>0 / 4</b></span></div><div class="memory-board" aria-label="Memory cards"></div><button class="primary game-start">Shuffle & play →</button>');
  let opened=[],matched=0,locked=false,wait=0;const board=$('.memory-board',surface),start=$('.game-start',surface);
  function build(active){const symbols=['✳','◈','☾','⚡','✳','◈','☾','⚡'];for(let i=symbols.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[symbols[i],symbols[j]]=[symbols[j],symbols[i]];}
    board.replaceChildren();symbols.forEach((symbol,index)=>{const cell=document.createElement('button');cell.className='memory-card';cell.textContent='✦';cell.setAttribute('aria-label','Reveal card '+(index+1));cell.disabled=!active;api.on(cell,'click',()=>{if(api.status!=='playing'||locked||cell.classList.contains('flipped')||cell.classList.contains('matched'))return;cell.textContent=symbol;cell.classList.add('flipped');cell.setAttribute('aria-label','Revealed '+symbol);opened.push({cell,symbol});if(opened.length!==2)return;api.setScore(api.score+1);if(opened[0].symbol===opened[1].symbol){opened.forEach(item=>{item.cell.classList.add('matched');item.cell.disabled=true;});opened=[];matched++;$('[data-pairs]',surface).textContent=matched+' / 4';if(matched===4)api.finish('moves to find all four pairs');}else{locked=true;wait=.7;}});board.append(cell);});}
  api.onStart=()=>{opened=[];matched=0;locked=false;wait=0;start.hidden=true;$('[data-pairs]',surface).textContent='0 / 4';build(true);};
  api.onTick=dt=>{if(!locked)return;wait-=dt;if(wait<=0){opened.forEach(item=>{item.cell.classList.remove('flipped');item.cell.textContent='✦';item.cell.setAttribute('aria-label','Reveal card');});opened=[];locked=false;}};
  api.on(start,'click',()=>api.start());build(false);return api;
}
function createColorGame(game) {
  const palette=[{name:'PINK',color:'#ff91bb'},{name:'BLUE',color:'#79d6ff'},{name:'GOLD',color:'#ffcc7a'},{name:'MINT',color:'#8de7c3'}];
  const api=baseGame(game,hud()+'<div class="color-word">READY?</div><div class="color-options"></div><button class="primary game-start">Play Color Clash →</button>');const word=$('.color-word',surface),start=$('.game-start',surface),options=$('.color-options',surface);let answer=0;
  function round(){answer=Math.floor(Math.random()*4);word.textContent=palette[(answer+1+Math.floor(Math.random()*3))%4].name;word.style.color=palette[answer].color;}
  palette.forEach((color,i)=>{const button=document.createElement('button');button.className='color-option';button.textContent=color.name;api.on(button,'click',()=>{if(api.status!=='playing')return;if(i===answer){api.setScore(api.score+1);round();}else{api.setScore(Math.max(0,api.score-1));word.classList.remove('feedback-error');requestAnimationFrame(()=>word.classList.add('feedback-error'));}});options.append(button);});
  api.onStart=()=>{start.hidden=true;api.setTime(20);round();};api.onTick=()=>{api.setTime(Math.max(0,Math.ceil(20-api.elapsed)));if(api.elapsed>=20)api.finish('correct-colour points. Brain: warmed up.');};api.on(start,'click',()=>api.start());api.setTime(20);return api;
}
function createCanvasGame(game) {
  const api=baseGame(game,hud(game.id==='orbit'?'LIVES':game.id==='lane'?'SPEED':'HEIGHT')+'<canvas class="game-canvas" width="720" height="490" aria-label="'+game.title+' interactive game arena"></canvas><div class="canvas-actions"><button class="primary game-start">Play '+game.title+' →</button></div>');
  const canvas=$('canvas',surface),ctx=canvas.getContext('2d'),actions=$('.canvas-actions',surface),start=$('.game-start',surface);ctx.scale(2,2);let engine;
  const drawText=(text,x,y,size=12,color='#b5c0c6')=>{ctx.fillStyle=color;ctx.font=`600 ${size}px system-ui`;ctx.textAlign='center';ctx.fillText(text,x,y);};
  function background(){ctx.clearRect(0,0,360,245);ctx.fillStyle='#10171c';ctx.fillRect(0,0,360,245);ctx.strokeStyle='#ffffff08';ctx.lineWidth=1;for(let x=0;x<360;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,245);ctx.stroke();}for(let y=0;y<245;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(360,y);ctx.stroke();}}
  const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,4);ctx.fill();};
  if(game.id==='stack'){
    let blocks=[],moving,direction=1,speed=100;
    function reset(){blocks=[{x:115,width:130}];moving={x:5,width:130};direction=1;speed=100;api.setTime('0');}
    function drop(){if(api.status!=='playing')return;const previous=blocks.at(-1),difference=Math.abs(previous.x-moving.x);let overlap=ArcadeRules.stackOverlap(previous,moving);if(overlap.width<4){api.finish('blocks stacked. Find your rhythm.');return;}if(difference<=6)overlap={x:previous.x,width:previous.width};blocks.push(overlap);api.setScore(blocks.length-1);api.setTime(api.score);moving={x:direction===1?360-overlap.width:0,width:overlap.width};direction*=-1;speed=Math.min(235,100+api.score*9);draw();}
    function draw(){background();const visible=api.status==='ready'?[{x:90,width:180},{x:100,width:160},{x:110,width:140},{x:120,width:120},{x:130,width:100}]:blocks.slice(-8),baseY=222;visible.forEach((block,i)=>rect(block.x,baseY-i*22,block.width,18,`hsl(${80+i*7} 65% ${45+i*3}%)`));if(moving)rect(moving.x,baseY-visible.length*22,moving.width,18,game.color);if(api.status==='ready')drawText('STACK IT. DON’T OVERTHINK IT.',180,32,10);}
    engine={reset,draw,update(dt){moving.x+=direction*speed*dt;if(moving.x<0){moving.x=0;direction=1;}if(moving.x+moving.width>360){moving.x=360-moving.width;direction=-1;}},action:drop};
  } else if(game.id==='orbit'){
    let angle=-Math.PI/2,target=.4,lives=3,width=.5,rotation=1.9;
    function reset(){angle=-Math.PI/2;target=.4;lives=3;width=.5;rotation=1.9;api.setTime(lives);}
    function hit(){if(api.status!=='playing')return;if(ArcadeRules.angularDistance(angle,target)<width){api.setScore(api.score+1);target=(target+1.3+Math.random()*2)%(Math.PI*2);width=Math.max(.22,.5-api.score*.012);rotation=Math.min(3.8,1.9+api.score*.1);}else{lives--;api.setTime(lives);if(lives===0)api.finish('perfectly timed pops. One more orbit?');}draw();}
    function draw(){background();const cx=180,cy=122,r=82;ctx.lineWidth=9;ctx.strokeStyle='#ffffff12';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=game.color;ctx.lineCap='round';ctx.beginPath();ctx.arc(cx,cy,r,target-width,target+width);ctx.stroke();ctx.shadowColor=game.color;ctx.shadowBlur=16;ctx.fillStyle='#f4f0ff';ctx.beginPath();ctx.arc(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r,8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;drawText('TAP IN THE ZONE',180,120,10);drawText(api.status==='ready'?'READY TO ORBIT?':String(api.score),180,147,25,game.color);}
    engine={reset,draw,update(dt){angle=(angle+rotation*dt)%(Math.PI*2);},action:hit};
  } else {
    let lane=1,obstacles=[],spawn=0,road=0,speed=100;
    const laneX=index=>75+index*105;
    function reset(){lane=1;obstacles=[];spawn=.8;road=0;speed=100;api.setTime('1×');}
    function move(direction){if(api.status==='playing')lane=Math.max(0,Math.min(2,lane+direction));draw();}
    function draw(){background();ctx.strokeStyle='#79d6ff20';ctx.setLineDash([11,14]);ctx.lineWidth=2;[127.5,232.5].forEach(x=>{ctx.beginPath();ctx.moveTo(x,-25+road);ctx.lineTo(x,270);ctx.stroke();});ctx.setLineDash([]);for(const obstacle of obstacles){rect(laneX(obstacle.lane)-18,obstacle.y,36,24,'#ff91bb');rect(laneX(obstacle.lane)-12,obstacle.y+5,24,3,'#ffd1e2');}rect(laneX(lane)-15,195,30,36,game.color);rect(laneX(lane)-10,200,20,9,'#154759');rect(laneX(lane)-10,224,5,3,'#f5ffd9');rect(laneX(lane)+5,224,5,3,'#f5ffd9');if(api.status==='ready')drawText('TAKE THE LONG WAY HOME.',180,95,11);}
    engine={reset,draw,update(dt){speed=100+Math.min(130,api.score*5);road=(road+speed*dt)%25;spawn-=dt;if(spawn<=0){obstacles.push({lane:Math.floor(Math.random()*3),y:-30,counted:false});spawn=Math.max(.52,1-api.score*.015);}for(const obstacle of obstacles){obstacle.y+=speed*dt;if(ArcadeRules.rectanglesOverlap({x:laneX(lane)-13,y:198,width:26,height:30},{x:laneX(obstacle.lane)-16,y:obstacle.y+2,width:32,height:20})){api.finish('blocks dodged. The road calls again.');return;}if(obstacle.y>234&&!obstacle.counted){obstacle.counted=true;api.setScore(api.score+1);}}obstacles=obstacles.filter(obstacle=>obstacle.y<260);api.setTime((speed/100).toFixed(1)+'×');},action:move};
  }
  api.onStart=()=>{engine.reset();start.hidden=true;$$('.round-control',actions).forEach(button=>button.remove());if(game.id==='lane'){for(const direction of [-1,1]){const button=document.createElement('button');button.className='lane-control round-control';button.textContent=direction<0?'←':'→';button.setAttribute('aria-label',direction<0?'Move left':'Move right');api.on(button,'click',()=>engine.action(direction));actions.append(button);}}else{const button=document.createElement('button');button.className='primary round-control';button.textContent=game.id==='stack'?'Drop block ↓':'Pop! ✦';api.on(button,'click',()=>engine.action());actions.append(button);}engine.draw();};
  api.onTick=dt=>{engine.update(dt);engine.draw();};
  api.onKey=code=>{if(game.id==='lane'){if(code==='ArrowLeft'||code==='ArrowRight')engine.action(code==='ArrowLeft'?-1:1);}else if(code==='Space')engine.action();};
  api.on(canvas,'pointerdown',event=>{if(api.status!=='playing')return;event.preventDefault();if(game.id==='lane'){const r=canvas.getBoundingClientRect();engine.action(event.clientX<r.left+r.width/2?-1:1);}else engine.action();});
  api.on(start,'click',()=>api.start());engine.reset();engine.draw();return api;
}
if(!deepLink())goTo(0,true);
