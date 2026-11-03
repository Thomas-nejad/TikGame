/* Reviewed integration of Claude's proposed growth features. No analytics or tracking. */
(function (root) {
  'use strict';
  const DAY = 86400000;
  function dayKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function ordinal(key) {
    if (typeof key !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(key)) return null;
    const [year, month, day] = key.split('-').map(Number);
    const value = new Date(Date.UTC(year, month - 1, day));
    return value.getUTCFullYear() === year && value.getUTCMonth() === month - 1 && value.getUTCDate() === day ? value.getTime() / DAY : null;
  }
  function normalise(raw) {
    const validCount = n => Number.isInteger(n) && n >= 0 && n <= 100000;
    const count = validCount(raw?.count) ? raw.count : 0;
    const last = ordinal(raw?.last) == null ? null : raw.last;
    return {last, count:last ? count : 0, best:Math.max(validCount(raw?.best) ? raw.best : 0, last ? count : 0)};
  }
  function state(raw, today) {
    const result = normalise(raw), currentDay = ordinal(today);
    const gap = result.last && currentDay != null ? currentDay - ordinal(result.last) : null;
    const alive = (gap === 0 || gap === 1) && result.count > 0;
    return {...result, count:alive ? result.count : 0, alive, playedToday:gap === 0 && alive};
  }
  function advance(raw, today) {
    const result = normalise(raw), currentDay = ordinal(today);
    if (currentDay == null) return result;
    if (result.last === today && result.count > 0) return result;
    const gap = result.last ? currentDay - ordinal(result.last) : null;
    const count = gap === 1 ? Math.min(100000, result.count + 1) : 1;
    return {last:today, count, best:Math.max(result.best, count)};
  }
  function dailyIndex(date, count) { return count > 0 ? ((Math.floor(date.getTime() / DAY) % count) + count) % count : 0; }
  function shareText(game, best) {
    return Number.isFinite(best)
      ? `I got ${best} ${game.lower ? 'moves' : 'points'} in ${game.title} on Loop. ${game.lower ? 'Can you do it in fewer moves?' : 'Can you beat my score?'}`
      : `Try ${game.title} on Loop — an instant mini-game. Play a round and challenge me!`;
  }
  const rules = {dayKey, ordinal, normalise, state, advance, dailyIndex, shareText};
  if (typeof module !== 'undefined' && module.exports) module.exports = rules;
  else root.LoopGrowthRules = rules;
  if (typeof document === 'undefined' || typeof games === 'undefined') return;

  const KEY = 'loop-streak';
  const load = () => { try { return normalise(JSON.parse(localStorage.getItem(KEY))); } catch { return normalise(null); } };
  const save = value => { try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* Gameplay still works when storage is unavailable. */ } };
  const chip = document.createElement('span');
  chip.className = 'streak-chip cold'; chip.setAttribute('role', 'status');
  chip.title = 'Complete a round to record a day of play. Stored in this browser only.';
  const tabs = document.querySelector('.player-tabs');
  tabs.insertBefore(chip, tabs.querySelector('.keyboard-hint'));
  function renderDay() {
    const value = state(load(), dayKey());
    chip.classList.toggle('cold', !value.alive);
    chip.textContent = value.alive ? `🔥 ${value.count} ${value.count === 1 ? 'day' : 'days'}${value.playedToday ? ' ✓' : ''}` : '✦ Daily play';
    chip.setAttribute('aria-label', value.alive ? `${value.count} consecutive days played. ${value.playedToday ? 'Played today.' : 'No completed round today yet.'}` : 'Complete a round to start your local play streak.');
    const button = document.querySelector('#daily-challenge');
    const game = games[dailyIndex(new Date(), games.length)];
    if (button) { button.textContent = `Today's pick: ${game.title} →`; button.onclick = () => goTo(dailyIndex(new Date(), games.length)); }
  }
  document.addEventListener('loop:round-complete', event => {
    if (!games.some(game => game.id === event.detail?.gameId) || !Number.isFinite(event.detail?.score)) return;
    const before = load(), today = dayKey(), after = advance(before, today);
    if (before.last === after.last && before.count === after.count) return;
    save(after); renderDay();
    showToast(after.count === 1 ? 'First day recorded. Nice round!' : `${after.count} days of play recorded in this browser.`);
  });
  let midnightTimer;
  function refreshDay() {
    clearTimeout(midnightTimer); renderDay();
    const now = new Date();
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    const utcMidnight = (Math.floor(now.getTime() / DAY) + 1) * DAY;
    midnightTimer = setTimeout(refreshDay, Math.max(1000, Math.min(localMidnight, utcMidnight) - now.getTime() + 100));
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDay(); });
  window.addEventListener('storage', event => { if (event.key === KEY) renderDay(); });
  refreshDay();

  if (typeof navigator.share === 'function') {
    const button = document.createElement('button');
    button.id = 'native-share'; button.className = 'primary'; button.textContent = 'Share with friends ↗';
    document.querySelector('#share-link').after(button);
    button.onclick = async () => {
      const game = games[current], url = document.querySelector('#share-link').value;
      button.disabled = true;
      try { await navigator.share({title:`${game.title} · Loop`, text:shareText(game, progress[game.id].best), url}); }
      catch (error) { if (error.name !== 'AbortError') showToast('Sharing was unavailable. Use Copy challenge link instead.'); }
      finally { button.disabled = false; }
    };
  }

  // Always offer accurate installation help; show the native prompt only when available.
  const install = document.createElement('button');
  install.id = 'install-app'; install.className = 'install-button'; install.textContent = '＋ Install';
  document.querySelector('.top-actions').prepend(install);
  const installHelp = document.createElement('dialog');
  installHelp.id = 'install-help'; installHelp.setAttribute('aria-labelledby', 'install-title');
  installHelp.innerHTML = '<div class="dialog-top"><h2 id="install-title">Keep Loop handy</h2><button class="close-button" aria-label="Close installation help">×</button></div><p>Install is optional. You can always play using the website link.</p><ul><li><strong>iPhone or iPad:</strong> open this page in Safari, choose Share, then Add to Home Screen.</li><li><strong>Android or desktop:</strong> look for Install app or Add to Home screen in your browser menu. Availability depends on your browser.</li></ul><p id="install-offline-note">Offline play needs one successful online visit to download the game files.</p>';
  installHelp.querySelector('.close-button').onclick = () => installHelp.close(); document.body.append(installHelp);
  let deferred;
  install.onclick = async () => {
    controller?.pause();
    if (!deferred) { installHelp.showModal(); return; }
    const prompt = deferred; deferred = null;
    try { await prompt.prompt(); const choice = await prompt.userChoice; if (choice.outcome === 'accepted') install.hidden = true; }
    catch { installHelp.showModal(); }
  };
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferred = event; install.hidden = false; });
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) install.hidden = true;
  window.addEventListener('appinstalled', () => { install.hidden = true; deferred = null; showToast('Loop added to your apps.'); });

  const offline = document.createElement('span'); offline.id = 'offline-status'; offline.setAttribute('role', 'status'); offline.textContent = 'Online play';
  document.querySelector('.page-footer').append(offline);
  const updateButton = document.createElement('button'); updateButton.id = 'update-app'; updateButton.className = 'update-button'; updateButton.textContent = 'Update ready ↻'; updateButton.hidden = true;
  document.querySelector('.page-footer').append(updateButton);
  const updateDialog = document.createElement('dialog'); updateDialog.id = 'update-dialog'; updateDialog.setAttribute('aria-labelledby', 'update-title');
  updateDialog.innerHTML = '<div class="dialog-top"><h2 id="update-title">A fresh Loop is ready</h2><button class="close-button" aria-label="Close update panel">×</button></div><p>Updating reloads the game screen. Your saved records stay, but an unfinished round will restart.</p><button class="primary" id="apply-update">Update and reload ↻</button><button class="secondary" id="later-update">Later</button>';
  document.body.append(updateDialog); updateDialog.querySelector('.close-button').onclick = () => updateDialog.close(); updateDialog.querySelector('#later-update').onclick = () => updateDialog.close();
  let registration, acceptedUpdate = false;
  updateButton.onclick = () => { controller?.pause(); updateDialog.showModal(); };
  updateDialog.querySelector('#apply-update').onclick = () => {
    if (!registration?.waiting) { updateDialog.close(); updateButton.hidden = true; return; }
    acceptedUpdate = true; updateDialog.querySelector('#apply-update').disabled = true;
    registration.waiting.postMessage({type:'SKIP_WAITING'});
  };
  function offerUpdate() { updateButton.hidden = !(registration?.waiting && registration?.active); }
  async function registerOffline() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) { offline.textContent = window.isSecureContext ? 'Online-only browser' : 'Offline needs HTTPS'; return; }
    offline.textContent = 'Preparing offline…';
    try {
      const base = new URL('./', document.baseURI);
      registration = await navigator.serviceWorker.register(new URL('sw.js', base).href, {scope:base.href, updateViaCache:'none'});
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (acceptedUpdate) location.reload(); else offerUpdate(); });
      offerUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed') offerUpdate(); if (worker.state === 'redundant' && !registration.active) offline.textContent = 'Offline setup failed; online play works'; });
      });
      const ready = await navigator.serviceWorker.ready;
      if (ready.scope === base.href) offline.textContent = '✓ Offline ready';
      offerUpdate();
      // The browser performs its own update checks too. Failure here does not affect offline play.
      registration.update().catch(() => {});
    } catch { offline.textContent = 'Online play · offline setup unavailable'; }
  }
  if (document.readyState === 'complete') registerOffline();
  else window.addEventListener('load', registerOffline, {once:true});
})(typeof globalThis !== 'undefined' ? globalThis : this);
