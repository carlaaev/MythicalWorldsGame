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

const LOGICAL_WIDTH = 800;
const LOGICAL_HEIGHT = 450;

/* ---------- Audio ---------- */
function playJumpSound() {
    if (!state.mute) {
        const jump = new Audio('assets/jump.mp3'); 
        jump.volume = 0.5;
        jump.play();
    }
}

let bgMusic = null;
function initMusic() {
    if (!bgMusic) {
        bgMusic = new Audio('assets/background.mp3'); // make sure this path is correct
        bgMusic.loop = true;
        bgMusic.volume = 0.3;
    }
}

function startMusic() {
    if (!state.mute && bgMusic) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(err => {
            console.log("Music blocked until user interaction:", err);
        });
    }
}

function stopMusic() {
    if (bgMusic) {
        bgMusic.pause();
    }
}

/* ---------- Game State ---------- */
const state = {
    playerName: '',
    difficulty: 'normal',
    mute: false,
    running: false,
    paused: false,
    score: 0,
    highScore: +(localStorage.getItem('fsr.highscore') || 0),
    player: { x: 120, y: 300, w: 48, h: 48, vx: 0, vy: 0, onGround: false },
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

function bindHold(btn, prop){
    btn.addEventListener('pointerdown', ()=>{ keys[prop]=true; });
    btn.addEventListener('pointerup', ()=>keys[prop]=false);
    btn.addEventListener('pointerleave', ()=>keys[prop]=false);
}
bindHold(btnLeft, 'left');
bindHold(btnRight, 'right');

btnJump.addEventListener('pointerdown', ()=>{ 
    if(state.player.onGround){
        state.player.vy = jumpPower;
        state.player.onGround = false;
        playJumpSound();
    }
});
btnJump.addEventListener('pointerup', ()=>keys.jump=false);

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
btnPlayAgain.addEventListener('click', ()=>{ overlay.classList.add('hidden'); startGame(); });
btnToSettings.addEventListener('click', ()=>{
    overlay.classList.add('hidden');
    state.running=false;
    document.getElementById('settings').classList.remove('hidden');
});
btnJump.addEventListener('click', ()=>{ keys.jump = true; setTimeout(()=>keys.jump=false, 200); });
btnPause.addEventListener('click', togglePause);

/* ---------- Pause ---------- */
function togglePause(){
    if(!state.running) return;
    state.paused = !state.paused;
    btnPause.textContent = state.paused ? '▶' : '⏸';
    if(state.paused) bgMusic.pause();
    else if(!state.mute) bgMusic.play();
}

/* ---------- Game Functions ---------- */
const gravity = 0.7;
const jumpPower = -14;

function getGroundY(){
    return canvas.height - 50;
}

function startGame(){
    state.player.x = 120;
    state.player.y = getGroundY() - state.player.h;
    state.player.vx = 0;
    state.player.vy = 0;
    state.score = 0;
    state.obstacles = [];
    state.lastSpawn = 0;
    state.running = true;
    state.paused = false;

    initMusic();
    startMusic();
}

/* ---------- Obstacles ---------- */
function spawnObstacle(){
    const width = 20 + Math.random() * 40;
    const height = 20 + Math.random() * 50;
    const colors = ["#8a7a6b","#d9c2a2","#b07b4f"];
    const color = colors[Math.floor(Math.random()*colors.length)];
    state.obstacles.push({
        x: canvas.width + 10,
        y: getGroundY() - height,
        w: width,
        h: height,
        color: color,
    });
}

/* ---------- Update ---------- */
function update(delta){
    if(!state.running || state.paused) return;

    const baseSpeed = state.difficulty==='easy'?4:state.difficulty==='normal'?6:8;
    const speed = baseSpeed + Math.floor(state.score/100);

    if(keys.left) state.player.x -= speed;
    if(keys.right) state.player.x += speed;

    state.player.vy += gravity;
    state.player.y += state.player.vy;

    if(keys.jump && state.player.onGround){
        state.player.vy = jumpPower;
        state.player.onGround = false;
        playJumpSound();
    }

    const groundY = getGroundY();
    if(state.player.y + state.player.h >= groundY){
        state.player.y = groundY - state.player.h;
        state.player.vy = 0;
        state.player.onGround = true;
    }

    state.lastSpawn += delta;
    if(state.lastSpawn > 1200){ spawnObstacle(); state.lastSpawn = 0; }

    for(let obs of state.obstacles) obs.x -= speed;
    state.obstacles = state.obstacles.filter(o => o.x+o.w>0);

    for(let obs of state.obstacles){
        if(rectIntersect(state.player, obs)) gameOver();
    }

    state.score += delta*0.01;
}

/* ---------- Background ---------- */
const bgLayers = [
    { speed:0.2, color:"#cce6ff", elements:[] },
    { speed:0.5, color:"#99cc99", elements:[] },
];
function initBackground(){
    bgLayers.forEach((layer,idx)=>{
        layer.elements = [];
        for(let i=0;i<5;i++){
            layer.elements.push({
                x:i*canvas.width/2,
                y: idx===0?0:getGroundY()-100,
                w: canvas.width/2,
                h: idx===0?getGroundY():100,
            });
        }
    });
}
initBackground();

/* ---------- Draw ---------- */
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    bgLayers.forEach(layer=>{
        ctx.fillStyle=layer.color;
        layer.elements.forEach(el=>ctx.fillRect(el.x,el.y,el.w,el.h));

        layer.elements.forEach(el=>el.x -= layer.speed);
        if(layer.elements[0].x + layer.elements[0].w <0){
            const el = layer.elements.shift();
            el.x = layer.elements[layer.elements.length-1].x + el.w;
            layer.elements.push(el);
        }
    });

    ctx.fillStyle="#8fbf8f";
    ctx.fillRect(0,getGroundY(),canvas.width,canvas.height-getGroundY());

    ctx.fillStyle="#e07b5a";
    ctx.fillRect(state.player.x,state.player.y,state.player.w,state.player.h);

    state.obstacles.forEach(o=>{ ctx.fillStyle=o.color; ctx.fillRect(o.x,o.y,o.w,o.h); });

    ctx.fillStyle="#3b2f2f";
    ctx.font='20px "Patrick Hand"';
    ctx.fillText(`${state.playerName||"Player"} | Difficulty: ${state.difficulty}`,10,30);
    ctx.fillText(`Score: ${Math.floor(state.score)}`,10,60);
}

/* ---------- Collision ---------- */
function rectIntersect(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

/* ---------- Game Over ---------- */
function gameOver(){
    state.running=false;
    stopMusic();

    finalScoreEl.textContent=`Score: ${Math.floor(state.score)}`;
    if(state.score>state.highScore){
        state.highScore=Math.floor(state.score);
        localStorage.setItem('fsr.highscore',state.highScore);
    }
    bestScoreEl.textContent=`High Score: ${state.highScore}`;
    overlay.classList.remove('hidden');
}

/* ---------- Main Loop ---------- */
let lastTime=0;
function loop(time){
    const delta = time-lastTime;
    lastTime = time;

    if(state.running){
        if(!state.paused) update(delta);
        draw();
        if(state.paused){
            ctx.fillStyle="rgba(0,0,0,0.4)";
            ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle="#fff";
            ctx.font='40px "Patrick Hand"';
            ctx.textAlign="center";
            ctx.fillText("PAUSED",canvas.width/2,canvas.height/2);
            ctx.textAlign="left";
        }
    }

    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ---------- Responsive Canvas ---------- */
function resizeCanvas(){
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();