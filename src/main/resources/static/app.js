const feed = document.querySelector("#game-feed");
const toast = document.querySelector("#toast");
let toastTimeout;
let progress;
try { progress = JSON.parse(localStorage.getItem('loop-progress')) || {}; } catch { progress = {}; }
if (!progress || typeof progress !== 'object' || Array.isArray(progress)) progress = {};
function persist() { try { localStorage.setItem('loop-progress', JSON.stringify(progress)); } catch { showToast('Storage unavailable; progress lasts for this visit.'); } }
function isVisibleGame(game) { const r=game.closest('.game-slide').getBoundingClientRect(), f=feed.getBoundingClientRect(); return r.top < f.top + f.height/2 && r.bottom > f.top + f.height/2; }
function recordScore(game, score) {
 const id=game.closest('.game-slide').dataset.game;
 const entry=progress[id] ||= {};
 entry.best=entry.best == null ? score : id==='memory' ? Math.min(entry.best,score) : Math.max(entry.best,score);
 entry.plays=(entry.plays||0)+1; persist(); showToast('Personal best: '+entry.best+(id==='memory'?' moves':' points'));
}
function challengeLink(slide) {
 const url=new URL(location.href); url.hash='game='+slide.dataset.game;
 const best=progress[slide.dataset.game]?.best;
 if(best != null) url.hash+='&score='+best;
 return url.href;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 1900);
}

function currentSlides() {
  return [...feed.querySelectorAll(".game-slide")];
}

function goToSlide(direction) {
  const slides = currentSlides();
  const current = Math.round(feed.scrollTop / feed.clientHeight);
  const next = (current + direction + slides.length) % slides.length;
  slides[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelector("#next-game").addEventListener("click", () => goToSlide(1));
document.querySelector("#prev-game").addEventListener("click", () => goToSlide(-1));

document.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    goToSlide(1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    goToSlide(-1);
  } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    const activeGame = document.querySelector(".lane-game.is-playing");
    if (activeGame) movePlayer(activeGame, event.key === "ArrowLeft" ? -1 : 1);
  }
});

function startTapGame(game) {
  if (game.classList.contains("is-playing")) return;
  game.classList.remove("is-over");
  game.classList.add("is-playing");
  game.querySelector(".tap-start").style.display = "";
  game.querySelector(".tap-instructions p").textContent = "Hit as many targets as you can before the clock runs out.";
  let score = 0;
  let time = 15;
  const scoreElement = game.querySelector(".tap-score");
  const timerElement = game.querySelector(".tap-timer");
  const cells = [...game.querySelectorAll(".tap-cell")];
  scoreElement.textContent = "00";
  timerElement.textContent = time;

  const setTarget = () => {
    cells.forEach((cell) => cell.classList.remove("target"));
    cells[Math.floor(Math.random() * cells.length)].classList.add("target");
  };
  setTarget();
  cells.forEach((cell) => {
    cell.onclick = () => {
      if (!game.classList.contains("is-playing") || !cell.classList.contains("target")) return;
      score += 1;
      scoreElement.textContent = String(score).padStart(2, "0");
      setTarget();
    };
  });

  const timer = setInterval(() => {
    if (document.hidden || !isVisibleGame(game)) return;
    time -= 1;
    timerElement.textContent = time;
    if (time <= 0) {
      clearInterval(timer);
      game.classList.remove("is-playing");
      game.classList.add("is-over");
      cells.forEach((cell) => {
        cell.classList.remove("target");
        cell.onclick = null;
      });
      recordScore(game, score);
      game.querySelector(".tap-instructions p").textContent = `Time's up! You hit ${score} target${score === 1 ? "" : "s"}.`;
      game.querySelector(".tap-start").textContent = "↻  Play again";
      game.querySelector(".tap-start").style.display = "inline-flex";
    }
  }, 1000);
}

function createMemoryGame(game) {
  const board = game.querySelector(".memory-board");
  const symbols = ["✦", "◈", "●"];
  let cards = [];
  let opened = [];
  let moves = 0;
  let pairs = 0;
  let locked = false;
  let pending;

  const reset = () => {
    clearTimeout(pending);
    cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
    opened = [];
    moves = 0;
    pairs = 0;
    locked = false;
    game.querySelector(".memory-moves").textContent = "0";
    game.querySelector(".memory-pairs").textContent = "0/3";
    board.replaceChildren(...cards.map((symbol) => {
      const card = document.createElement("button");
      card.className = "memory-card";
      card.type = "button";
      card.setAttribute("aria-label", "Reveal card");
      card.textContent = "?";
      card.addEventListener("click", () => {
        if (locked || card.classList.contains("flipped") || card.classList.contains("matched")) return;
        card.textContent = symbol;
        card.classList.add("flipped");
        card.setAttribute("aria-label", `${symbol} card`);
        opened.push({ card, symbol });
        if (opened.length !== 2) return;
        moves += 1;
        game.querySelector(".memory-moves").textContent = moves;
        if (opened[0].symbol === opened[1].symbol) {
          opened.forEach(({ card: match }) => match.classList.add("matched"));
          opened = [];
          pairs += 1;
          game.querySelector(".memory-pairs").textContent = `${pairs}/3`;
          if (pairs === 3) recordScore(game, moves);
          if (pairs === 3) setTimeout(() => showToast(`All matched in ${moves} moves!`), 250);
          return;
        }
        locked = true;
        setTimeout(() => {
          opened.forEach(({ card: mismatch }) => {
            mismatch.classList.remove("flipped");
            mismatch.textContent = "?";
            mismatch.setAttribute("aria-label", "Reveal card");
          });
          opened = [];
          locked = false;
        }, 700);
      });
      return card;
    }));
  };

  game.querySelector(".memory-reset").addEventListener("click", reset);
  reset();
}

const colors = [
  { name: "PINK", value: "#ff5b9b" },
  { name: "BLUE", value: "#61b8ff" },
  { name: "GOLD", value: "#ffc46b" },
  { name: "MINT", value: "#72e0af" }
];

function nextColorRound(game) {
  const word = colors[Math.floor(Math.random() * colors.length)];
  let ink = colors[Math.floor(Math.random() * colors.length)];
  while (ink === word) ink = colors[Math.floor(Math.random() * colors.length)];
  game.querySelector(".color-word").textContent = word.name;
  game.querySelector(".color-word").style.color = ink.value;
  game.dataset.answer = ink.name;
}

function startColorGame(game) {
  if (game.classList.contains("is-playing")) return;
  game.classList.remove("is-over");
  game.classList.add("is-playing");
  game.querySelector(".color-start").style.display = "";
  let score = 0;
  let time = 20;
  const scoreElement = game.querySelector(".color-score");
  const timerElement = game.querySelector(".color-timer");
  scoreElement.textContent = "0";
  timerElement.textContent = time;
  nextColorRound(game);

  const options = game.querySelector(".color-options");
  options.replaceChildren(...colors.map((color) => {
    const button = document.createElement("button");
    button.className = "color-option";
    button.type = "button";
    button.textContent = color.name;
    button.addEventListener("click", () => {
      if (!game.classList.contains("is-playing")) return;
      const correct = game.dataset.answer === color.name;
      if (correct) {
        score += 1;
        scoreElement.textContent = score;
        nextColorRound(game);
      } else {
        game.querySelector(".color-word").classList.remove("color-feedback");
        requestAnimationFrame(() => game.querySelector(".color-word").classList.add("color-feedback"));
      }
    });
    return button;
  }));
  const timer = setInterval(() => {
    if (document.hidden || !isVisibleGame(game)) return;
    time -= 1;
    timerElement.textContent = time;
    if (time <= 0) {
      clearInterval(timer);
      game.classList.remove("is-playing");
      game.classList.add("is-over");
      recordScore(game, score);
      game.querySelector(".color-word").textContent = `${score} POINT${score === 1 ? "" : "S"}`;
      game.querySelector(".color-word").style.color = "#f4fff0";
      game.querySelector(".color-start").textContent = "↻  Play again";
      game.querySelector(".color-start").style.display = "inline-flex";
    }
  }, 1000);
}

const lanePositions = [25, 50, 75];
function movePlayer(game, direction) {
  const player = game.querySelector(".player-dot");
  const current = Number(player.dataset.lane || 1);
  const next = Math.max(0, Math.min(2, current + direction));
  player.dataset.lane = next;
  player.style.left = `calc(${lanePositions[next]}% - 9px)`;
}

function startLaneGame(game) {
  if (game.classList.contains("is-playing")) return;
  const arena = game.querySelector(".lane-arena");
  const player = game.querySelector(".player-dot");
  const obstacles = game.querySelector(".lane-obstacles");
  game.classList.remove("is-over");
  game.classList.add("is-playing");
  game.querySelector(".lane-start-button").style.display = "";
  arena.classList.remove("over");
  arena.classList.add("running");
  obstacles.replaceChildren();
  player.dataset.lane = 1;
  player.style.left = "calc(50% - 9px)";
  let score = 0;
  let frame = 0;
  let running = true;
  const scoreElement = game.querySelector(".lane-score-value");
  scoreElement.textContent = "0";

  const finish = () => {
    if (!running) return;
    running = false;
    recordScore(game, score);
    game.classList.remove("is-playing");
    game.classList.add("is-over");
    arena.classList.remove("running");
    arena.classList.add("over");
    arena.querySelector(".lane-start span").textContent = `GAME OVER · ${score}`;
    arena.querySelector(".lane-start small").textContent = "TAP START TO TRY AGAIN";
    game.querySelector(".lane-start-button").textContent = "↻  Play again";
    game.querySelector(".lane-start-button").style.display = "inline-flex";
  };

  const tick = () => {
    if (!running) return;
    frame += 1;
    if (frame % 38 === 0) {
      const obstacle = document.createElement("i");
      obstacle.className = "obstacle";
      obstacle.dataset.lane = String(Math.floor(Math.random() * 3));
      obstacle.style.left = `calc(${lanePositions[Number(obstacle.dataset.lane)]}% - 11px)`;
      obstacles.append(obstacle);
    }
    [...obstacles.children].forEach((obstacle) => {
      const top = Number(obstacle.dataset.top || -20) + 3.2;
      obstacle.dataset.top = top;
      obstacle.style.top = `${top}px`;
      if (top > 178 && top < 216 && Number(obstacle.dataset.lane) === Number(player.dataset.lane || 1)) finish();
      if (top > 250) {
        obstacle.remove();
        score += 1;
        scoreElement.textContent = score;
      }
    });
    if (running) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  arena.onclick = (event) => {
    if (!running || event.target === player || event.target.closest(".lane-start")) return;
    const bounds = arena.getBoundingClientRect();
    movePlayer(game, event.clientX < bounds.left + bounds.width / 2 ? -1 : 1);
  };
}

function initializeSlide(slide) {
  const game = slide.querySelector(".tap-game");
  if (game) {
    game.querySelector(".tap-start").addEventListener("click", () => startTapGame(game));
  }
  const memory = slide.querySelector(".memory-game");
  if (memory) createMemoryGame(memory);
  const color = slide.querySelector(".color-game");
  if (color) color.querySelector(".color-start").addEventListener("click", () => startColorGame(color));
  const lane = slide.querySelector(".lane-game");
  if (lane) lane.querySelector(".lane-start-button").addEventListener("click", () => startLaneGame(lane));
}

function initializeActions(slide) {
  const likeCount = slide.querySelector(".like-action .rail-count");
  if (!likeCount.dataset.base) {
    const displayed = likeCount.textContent.trim();
    likeCount.dataset.base = Number(displayed.replace(/[^\d.]/g, "")) * (displayed.toLowerCase().includes("k") ? 1000 : 1);
  }
  slide.querySelector(".like-action").addEventListener("click", (event) => {
    const button = event.currentTarget;
    button.classList.toggle("liked");
    const count = button.querySelector(".rail-count");
    const original = Number(count.dataset.base);
    const updated = original + (button.classList.contains("liked") ? 1 : 0);
    count.textContent = button.classList.contains("liked") ? `${updated > 1000 ? `${(updated / 1000).toFixed(1)}k` : updated.toLocaleString()} ♥` : (original > 1000 ? `${(original / 1000).toFixed(1)}k` : original.toLocaleString());
  });
  slide.querySelector(".save-action").addEventListener("click", (event) => {
    const button = event.currentTarget;
    button.classList.toggle("saved");
    button.querySelector(".rail-count").textContent = button.classList.contains("saved") ? "Saved" : "Save";
    showToast(button.classList.contains("saved") ? "Added to your saved games" : "Removed from saved games");
  });
  slide.querySelector(".share-action").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(challengeLink(slide));
      showToast("Link copied to clipboard");
    } catch (error) {
      showToast("Sharing is unavailable in this browser");
    }
  });
  slide.querySelector(".comment-action").addEventListener("click", () => showToast("Comments are coming soon"));
}

currentSlides().forEach((slide) => {
  initializeSlide(slide);
  initializeActions(slide);
});

document.querySelector("#daily-button").addEventListener("click", () => showToast("Your scores and favourites are saved on this browser."));
document.querySelector("#invite-button").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast("Invite link copied. Send it to a friend!");
  } catch (error) {
    showToast("Invite your friends to play together!");
  }
});
document.querySelector(".search-toggle").addEventListener("click", () => {
  const popover = document.querySelector("#search-popover");
  popover.classList.toggle("open");
  if (popover.classList.contains("open")) document.querySelector("#game-search").focus();
});
document.querySelector("#game-search").addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const term = event.currentTarget.value.trim().toLowerCase();
  if (!term) return;
  const match = currentSlides().find((slide) => slide.textContent.toLowerCase().includes(term));
  if (match) {
    match.scrollIntoView({ behavior: "smooth", block: "start" });
    document.querySelector("#search-popover").classList.remove("open");
  } else showToast("No games found. Keep exploring!");
});
document.querySelectorAll(".feed-tab").forEach((tab) => tab.addEventListener("click", () => {
  document.querySelectorAll(".feed-tab").forEach((item) => {
    item.classList.toggle("active", item === tab);
    item.setAttribute("aria-selected", String(item === tab));
  });
  if (tab.textContent.includes("Following")) showToast("You're all caught up with creators you follow");
}));

// Local collection and deep links work without an account or Java backend.
currentSlides().forEach(slide=>{
 const id=slide.dataset.game, entry=progress[id] ||= {};
 const save=slide.querySelector('.save-action'), like=slide.querySelector('.like-action');
 save.classList.toggle('saved',!!entry.saved); save.setAttribute('aria-pressed',String(!!entry.saved));
 save.querySelector('.rail-count').textContent=entry.saved?'Saved':'Save';
 save.addEventListener('click',()=>{entry.saved=save.classList.contains('saved');save.setAttribute('aria-pressed',String(entry.saved));persist();});
 like.querySelector('.rail-count').dataset.base='0'; like.querySelector('.rail-count').textContent=entry.liked?'Liked':'Like';like.classList.toggle('liked',!!entry.liked);
 like.addEventListener('click',()=>{entry.liked=like.classList.contains('liked');like.setAttribute('aria-pressed',String(entry.liked));like.querySelector('.rail-count').textContent=entry.liked?'Liked':'Like';persist();});
 slide.querySelector('.comment-action .rail-count').textContent='Soon';
});
const daily=document.querySelector('#daily-button'); daily.textContent='Your progress';
function openDeepLink(){
 const params=new URLSearchParams(location.hash.slice(1)); const id=params.get('game');
 const slide=currentSlides().find(s=>s.dataset.game===id);
 if(slide){slide.scrollIntoView({block:'start'});const value=params.get('score');if(value && /^\d{1,6}$/.test(value))showToast('Challenge: '+value+(id==='memory'?' moves or fewer':' points to beat'));}
}
window.addEventListener('hashchange',openDeepLink);requestAnimationFrame(openDeepLink);
document.querySelectorAll('.nav-link[href]').forEach(link=>link.addEventListener('click',event=>{
 event.preventDefault();const target=link.getAttribute('href');
 if(target==='#saved'){const saved=currentSlides().find(s=>progress[s.dataset.game]?.saved);if(saved)saved.scrollIntoView({behavior:'smooth'});else showToast('Save a game using its bookmark button first.');}
 else if(target==='#leaderboard'){showToast(currentSlides().map(s=>s.querySelector('h2').textContent+': '+(progress[s.dataset.game]?.best??'—')).join(' · '));}
 else if(target==='#feed')currentSlides()[0].scrollIntoView({behavior:'smooth'});
 else showToast('Community features are planned. Explore the four launch games.');
}));
