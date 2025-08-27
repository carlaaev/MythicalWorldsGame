// === SCREENS ===
const settingsScreen = document.getElementById("settings");
const playerSetup = document.getElementById("player-setup");
const gameOver = document.getElementById("game-over");

// === FORM ===
const form = document.querySelector("#settings form");

// === STORAGE ===
let prefs = JSON.parse(localStorage.getItem("prefs")) || {};
let best = localStorage.getItem("best") || 0;
document.getElementById("bestScore").textContent = best;

// Pre-fill form if prefs exist
if (prefs.tag) {
  form.gamerTag.value = prefs.tag;
  form.difficulty.value = prefs.difficulty;
  form.theme.value = prefs.theme;
  form.music.value = prefs.music;
  form.sfx.value = prefs.sfx;
}

// Save on submit
form.addEventListener("submit", e => {
  e.preventDefault();
  prefs = {
    tag: form.gamerTag.value,
    difficulty: form.difficulty.value,
    theme: form.theme.value,
    music: form.music.value,
    sfx: form.sfx.value
  };
  localStorage.setItem("prefs", JSON.stringify(prefs));

  // Show welcome screen
  document.getElementById("displayName").textContent = prefs.tag;
  settingsScreen.classList.add("hidden");
  playerSetup.classList.remove("hidden");
});