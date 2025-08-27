/* ---------- DOM ---------- */
const settingsForm = document.getElementById("settingsForm");
const nameInput = document.getElementById("playerName");
const difficultySelect = document.getElementById("difficulty");
const muteInput = document.getElementById("mute");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const finalScoreEl = document.getElementById("finalScore");
const bestScoreEl = document.getElementById("bestScore");
const btnPlayAgain = document.getElementById("btnPlayAgain");
const btnToSettings = document.getElementById("btnToSettings");
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");
const btnJump = document.getElementById("btnJump");
const btnPause = document.getElementById("btnPause");

/* ---------- Game State ---------- */
const state = {
    playerName: '',
    difficulty: 'normal',
    mute: false,
    running: false,
    paused: false,
    score: 0,
    highScore: +(localStorage.getItem('fsr.highscore') || 0),
    player: {
        x: 120,
        y: 300,
        w: 48,
        h: 48,
        vx: 0,
        vy: 0,
        onGround: false,
        frame: 0,
        t: 0
    },
    obstacles: [],
    lastSpawn: 0,
};

/* ---------- Load Settings from localStorage ---------- */
(function loadSettings(){
    const saved = JSON.parse(localStorage.getItem('fsr.settings') || '{}');
    if(saved.playerName) nameInput.value = saved.playerName;
    if(saved.difficulty) difficultySelect.value = saved.difficulty;
    if(typeof saved.mute === 'boolean') muteInput.checked = saved.mute;
})();

/* ---------- Save Settings ---------- */
function saveSettings(){
    localStorage.setItem('fsr.settings', JSON.stringify({
        playerName: nameInput.value.trim(),
        difficulty: difficultySelect.value,
        mute: !!muteInput.checked
    }));
}

/* ---------- Input ---------- */
const keys = { left:false, right:false, jump:false };

addEventListener('keydown', e => {
    if(e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if(e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if(e.key === ' ') keys.jump = true;
    if(e.key === 'p') togglePause();
});
addEventListener('keyup', e => {
    if(e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if(e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if(e.key === ' ') keys.jump = false;
});

/* ---------- Touch Buttons ---------- */
function bindHold(btn, prop){
    btn.addEventListener('pointerdown', ()=>{
        keys[prop]=true;
        btn.setPointerCapture && btn.setPointerCapture(1);
    });
    btn.addEventListener('pointerup', ()=>keys[prop]=false);
    btn.addEventListener('pointerleave', ()=>keys[prop]=false);
}
bindHold(btnLeft, 'left');
bindHold(btnRight, 'right');
btnJump.addEventListener('click', ()=>{ keys.jump=true; setTimeout(()=>keys.jump=false, 60); });
btnPause.addEventListener('click', togglePause);

/* ---------- Form ---------- */
settingsForm.addEventListener('submit', e=>{
    e.preventDefault();
    saveSettings();

    state.playerName = nameInput.value.trim();
    state.difficulty = difficultySelect.value;
    state.mute = muteInput.checked;

    state.running = true;
    overlay.classList.add('hidden');
    canvas.classList.remove('hidden');
    document.getElementById('controls').classList.remove('hidden');

    console.log(`Game started: ${state.playerName}, difficulty: ${state.difficulty}`);
});

/* ---------- Overlay Buttons ---------- */
btnPlayAgain.addEventListener('click', ()=>{
    overlay.classList.add('hidden');
    startGame();
});
btnToSettings.addEventListener('click', ()=>{
    overlay.classList.add('hidden');
    state.running=false;
    document.getElementById('settings').classList.remove('hidden');
});

/* ---------- Pause ---------- */
function togglePause(){
    if(!state.running) return;
    state.paused = !state.paused;
    btnPause.textContent = state.paused ? '▶' : '⏸';
}

/* ---------- Placeholder Canvas Draw ---------- */
function drawPlaceholder(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#a7c080';
    ctx.fillRect(50, canvas.height-100, 48, 48); // simple player box
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(200, canvas.height-80, 40, 40); // simple obstacle
}
function loop(ts){
    if(state.running && !state.paused) drawPlaceholder();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ---------- Start Game Function (reset player & score) ---------- */
function startGame(){
    state.player.x = 120;
    state.player.y = canvas.height - 100;
    state.score = 0;
    state.obstacles = [];
    state.running = true;
    state.paused = false;
}