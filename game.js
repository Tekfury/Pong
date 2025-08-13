// --- Konstanten ---
const WIDTH = 800;
const HEIGHT = 600;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 6;
const BALL_SIZE = 10;
const BALL_SPEED_START = 5;
const BALL_SPEED_INC = 0.35; // nach jedem Treffer etwas schneller
const WIN_SCORE = 10;

// --- Canvas & Kontext ---
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// --- Spielzustand ---
const state = {
  running: true,
  left: { x: 30, y: HEIGHT / 2 - PADDLE_HEIGHT / 2, score: 0, up: false, down: false },
  right: { x: WIDTH - 30 - PADDLE_WIDTH, y: HEIGHT / 2 - PADDLE_HEIGHT / 2, score: 0, up: false, down: false },
  ball: { x: WIDTH / 2, y: HEIGHT / 2, vx: BALL_SPEED_START, vy: BALL_SPEED_START },
};

// --- Input ---
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyW") state.left.up = true;
  if (e.code === "KeyS") state.left.down = true;
  if (e.code === "ArrowUp") state.right.up = true;
  if (e.code === "ArrowDown") state.right.down = true;

  if (e.code === "Space") state.running = !state.running;
  if (e.code === "KeyR") reset(true);
});

window.addEventListener("keyup", (e) => {
  if (e.code === "KeyW") state.left.up = false;
  if (e.code === "KeyS") state.left.down = false;
  if (e.code === "ArrowUp") state.right.up = false;
  if (e.code === "ArrowDown") state.right.down = false;
});

// --- Helpers ---
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function reset(full = false) {
  state.ball.x = WIDTH / 2;
  state.ball.y = HEIGHT / 2;
  // starte in zufällige Richtung
  const dirX = Math.random() < 0.5 ? -1 : 1;
  const dirY = Math.random() < 0.5 ? -1 : 1;
  const speed = BALL_SPEED_START;
  state.ball.vx = dirX * speed;
  state.ball.vy = dirY * speed;

  if (full) {
    state.left.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
    state.right.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
    state.left.score = 0;
    state.right.score = 0;
    state.running = true;
  }
}

// --- Update-Logik ---
function update() {
  if (!state.running) return;

  // Paddles bewegen
  if (state.left.up) state.left.y -= PADDLE_SPEED;
  if (state.left.down) state.left.y += PADDLE_SPEED;
  if (state.right.up) state.right.y -= PADDLE_SPEED;
  if (state.right.down) state.right.y += PADDLE_SPEED;

  state.left.y = clamp(state.left.y, 0, HEIGHT - PADDLE_HEIGHT);
  state.right.y = clamp(state.right.y, 0, HEIGHT - PADDLE_HEIGHT);

  // Ball bewegen
  state.ball.x += state.ball.vx;
  state.ball.y += state.ball.vy;

  // Kollision oben/unten
  if (state.ball.y <= 0 || state.ball.y + BALL_SIZE >= HEIGHT) {
    state.ball.vy *= -1;
    // Randkorrektur, falls der Ball "klebt"
    state.ball.y = clamp(state.ball.y, 0, HEIGHT - BALL_SIZE);
  }

  // Kollision mit linkem Paddle
  if (
    state.ball.x <= state.left.x + PADDLE_WIDTH &&
    state.ball.x >= state.left.x &&
    state.ball.y + BALL_SIZE >= state.left.y &&
    state.ball.y <= state.left.y + PADDLE_HEIGHT
  ) {
    state.ball.vx = Math.abs(state.ball.vx) + BALL_SPEED_INC; // nach rechts, leicht schneller
    // Winkel abhängig vom Treffpunkt am Schläger
    const hitPos = ((state.ball.y + BALL_SIZE / 2) - (state.left.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
    state.ball.vy = Math.sign(state.ball.vy || 1) * Math.max(2, Math.abs(state.ball.vy));
    state.ball.vy += hitPos; // leichter Drall
    state.ball.x = state.left.x + PADDLE_WIDTH; // rauslösen
  }

  // Kollision mit rechtem Paddle
  if (
    state.ball.x + BALL_SIZE >= state.right.x &&
    state.ball.x + BALL_SIZE <= state.right.x + PADDLE_WIDTH &&
    state.ball.y + BALL_SIZE >= state.right.y &&
    state.ball.y <= state.right.y + PADDLE_HEIGHT
  ) {
    state.ball.vx = -Math.abs(state.ball.vx) - BALL_SPEED_INC; // nach links, leicht schneller
    const hitPos = ((state.ball.y + BALL_SIZE / 2) - (state.right.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
    state.ball.vy = Math.sign(state.ball.vy || 1) * Math.max(2, Math.abs(state.ball.vy));
    state.ball.vy += hitPos;
    state.ball.x = state.right.x - BALL_SIZE; // rauslösen
  }

  // Punkt links/rechts
  if (state.ball.x + BALL_SIZE < 0) {
    state.right.score++;
    checkWin() ? (state.running = false) : reset();
  }
  if (state.ball.x > WIDTH) {
    state.left.score++;
    checkWin() ? (state.running = false) : reset();
  }
}

function checkWin() {
  return state.left.score >= WIN_SCORE || state.right.score >= WIN_SCORE;
}

// --- Rendering ---
function drawRect(x, y, w, h) {
  ctx.fillRect(x, y, w, h);
}

function render() {
  // Hintergrund
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#0f172a";
  drawRect(0, 0, WIDTH, HEIGHT);

  // Mittellinie
  ctx.fillStyle = "#334155";
  for (let y = 0; y < HEIGHT; y += 24) {
    drawRect(WIDTH / 2 - 2, y, 4, 12);
  }

  // Paddles & Ball
  ctx.fillStyle = "#e2e8f0";
  drawRect(state.left.x, state.left.y, PADDLE_WIDTH, PADDLE_HEIGHT);
  drawRect(state.right.x, state.right.y, PADDLE_WIDTH, PADDLE_HEIGHT);
  drawRect(state.ball.x, state.ball.y, BALL_SIZE, BALL_SIZE);

  // Score
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 28px ui-sans-serif, system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`${state.left.score} : ${state.right.score}`, WIDTH / 2, 40);

  // Hinweise / gewonnen?
  if (!state.running) {
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 36px ui-sans-serif, system-ui";
    const winner = state.left.score > state.right.score ? "Links" : "Rechts";
    ctx.fillText(`${winner} gewinnt! (R für Reset)`, WIDTH / 2, HEIGHT / 2);
  }
}

// --- Game Loop ---
function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

// Startzustand & Loop starten
reset(true);
loop();
