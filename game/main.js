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
const spriteSheet = new Image();
spriteSheet.src = "sprites.png";

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
    },
    obstacles: [],
    lastSpawn: 0,
};

/* ---------- Settings ---------- */
(function loadSettings(){
    const saved = JSON.parse(localStorage.getItem('fsr.settings') || '{}');
    if(saved.playerName) nameInput.value = saved.playerName;
    if(saved.difficulty) difficultySelect.value = saved.difficulty;
    if(typeof saved.mute === 'boolean') muteInput.checked = saved.mute;
})();

function saveSettings(){
    localStorage.setItem('fsr.settings', JSON.stringify({
        playerName: nameInput.value.trim(),
        difficulty: difficultySelect.value,
        mute: !!muteInput.checked
    }));
}

/* ---------- Input ---------- */
const keys = { left:false, right:false, jump:false };

// Keyboard
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

// Touch buttons
function bindHold(btn, prop){
    btn.addEventListener('pointerdown', ()=>{ keys[prop]=true; btn.setPointerCapture && btn.setPointerCapture(1); });
    btn.addEventListener('pointerup', ()=>keys[prop]=false);
    btn.addEventListener('pointerleave', ()=>keys[prop]=false);
}
bindHold(btnLeft, 'left');
bindHold(btnRight, 'right');

// Jump button for touch
btnJump.addEventListener('click', ()=>{
    if(state.player.onGround){
        state.player.vy = jumpPower;
        state.player.onGround = false;
    }
});

/* ---------- Form ---------- */
settingsForm.addEventListener('submit', e=>{
    e.preventDefault();
    saveSettings();

    state.playerName = nameInput.value.trim();
    state.difficulty = difficultySelect.value;
    state.mute = muteInput.checked;

    state.running = true;
    overlay.classList.add('hidden');
    document.getElementById('controls').classList.remove('hidden');
    document.getElementById('settings').classList.add('hidden');

    startGame();
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
btnJump.addEventListener('click', ()=>{
    keys.jump = true;
    setTimeout(()=>keys.jump=false, 200);
});


/* ---------- Pause ---------- */
function togglePause(){
    if(!state.running) return;
    state.paused = !state.paused;
    btnPause.textContent = state.paused ? '▶' : '⏸';
}

/* ---------- Game Functions ---------- */
const gravity = 0.7;
const jumpPower = -14;
const groundY = canvas.height - 50;

function startGame(){
    state.player.x = 120;
    state.player.y = groundY - state.player.h;
    state.player.vx = 0;
    state.player.vy = 0;
    state.score = 0;
    state.obstacles = [];
    state.lastSpawn = 0;
    state.running = true;
    state.paused = false;
}

function spawnObstacle(){
    // Vary width/height
    const width = 20 + Math.random() * 40;  // 20-60px wide
    const height = 20 + Math.random() * 50; // 20-70px tall
    const minGap = 80;  // Minimum gap between obstacles
    const lastObs = state.obstacles[state.obstacles.length - 1];
    const lastX = lastObs ? lastObs.x + lastObs.w : canvas.width;

    // Place the new obstacle beyond the last one with some random spacing
    const xPos = Math.max(canvas.width + 10, lastX + minGap + Math.random() * 50);

    state.obstacles.push({
        x: xPos,
        y: groundY - height,
        w: width,
        h: height,
    });
}

function update(delta){
    if(!state.running || state.paused) return;

    // Speed scales with difficulty and score
    const baseSpeed = state.difficulty === 'easy' ? 4 : state.difficulty === 'normal' ? 6 : 8;
    const speed = baseSpeed + Math.floor(state.score / 100); // Slightly faster over time

    /* Player movement */
    if(keys.left) state.player.x -= speed;
    if(keys.right) state.player.x += speed;
    state.player.vy += gravity;
    state.player.y += state.player.vy;

    /* Jump */
    if(keys.jump && state.player.onGround){
        state.player.vy = jumpPower;
        state.player.onGround = false;
    }

    /* Ground collision */
    if(state.player.y + state.player.h >= groundY){
        state.player.y = groundY - state.player.h;
        state.player.vy = 0;
        state.player.onGround = true;
    }

    /* Spawn obstacles */
    state.lastSpawn += delta;
    if(state.lastSpawn > 1200){ // faster spawn for added challenge
        spawnObstacle();
        state.lastSpawn = 0;
    }

    /* Update obstacles */
    for(let obs of state.obstacles){
        obs.x -= speed;
    }
    state.obstacles = state.obstacles.filter(o=>o.x+o.w>0);

    /* Collision check */
    for(let obs of state.obstacles){
        if(rectIntersect(state.player, obs)){
            gameOver();
            return;
        }
    }

    /* Score */
    state.score += delta * 0.01;
}

/* ---------- Draw ---------- */
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    /* Background ground (Grass!) */
    ctx.fillStyle = '#8fbf8f';
    ctx.fillRect(0, groundY, canvas.width, canvas.height-groundY);

    /* Player placeholder */
    ctx.fillStyle = "#e07b5a";
    ctx.fillRect(state.player.x, state.player.y, state.player.w, state.player.h);

    /* Obstacles placeholder */
    ctx.fillStyle = "#8a7a6b";
    state.obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

    /* Score */
    ctx.fillStyle = '#3b2f2f';
    ctx.font = '20px "Patrick Hand"';
    ctx.fillText(`Score: ${Math.floor(state.score)}`, 10, 30);
}

/* ---------- Collision ---------- */
function rectIntersect(a,b){
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}

/* ---------- Game Over ---------- */
function gameOver(){
    state.running = false;
    finalScoreEl.textContent = `Score: ${Math.floor(state.score)}`;
    if(state.score > state.highScore){
        state.highScore = Math.floor(state.score);
        localStorage.setItem('fsr.highscore', state.highScore);
    }
    bestScoreEl.textContent = `High Score: ${state.highScore}`;
    overlay.classList.remove('hidden');
}

/* ---------- Main Loop ---------- */
let lastTime = 0;
function loop(time){
    const delta = time - lastTime;
    lastTime = time;

    update(delta);
    draw();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);