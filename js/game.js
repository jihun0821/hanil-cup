const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// 화면(뷰포트) 크기는 그대로 두고, 실제 경기장(world)만 훨씬 크게 만든다.
// 카메라가 사람이 조작하는 선수를 따라다니며 world의 일부만 잘라서 보여준다.
const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 540;

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1350;

const GOAL_HEIGHT = 200;
const leftGoal = {
  top: (WORLD_HEIGHT - GOAL_HEIGHT) / 2,
  bottom: (WORLD_HEIGHT + GOAL_HEIGHT) / 2
};
const rightGoal = { top: leftGoal.top, bottom: leftGoal.bottom };

const PLAYER_CONTROL_RANGE = 32; // 선수 반지름 + 공 반지름 + 여유값

const ball = new Ball(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
ball.owner = null;

const camera = { x: 0, y: 0 };

// ---- 타이머 설정 ----
// 게임 시간: 90분 = 실제 10분 (600초) = 600프레임 * 60fps = 36000프레임
// 각 전반/후반 45분 = 실제 5분 = 18000프레임
const TOTAL_GAME_TIME = 600; // 초 (실제 10분)
const HALF_TIME = 300; // 초 (실제 5분)
const FPS = 60;
const FRAMES_PER_HALF = HALF_TIME * FPS; // 18000프레임

let gameFrameCount = 0;
let currentHalf = 1; // 1: 전반, 2: 후반
let matchEnded = false;

// ---- 포메이션 생성 (4-4-2, 10명의 필드 플레이어) ----
// yFractions: 세로 방향으로 선수를 배치할 위치 비율
const Y_FRACTIONS = [0.15, 0.38, 0.62, 0.85];
const FORWARD_Y_FRACTIONS = [0.35, 0.65];

function buildOutfield(team, defX, midX, fwdX, humanIndex) {
  const positions = [];

  Y_FRACTIONS.forEach((yf) => positions.push({ x: defX, y: WORLD_HEIGHT * yf })); // 수비 4
  Y_FRACTIONS.forEach((yf) => positions.push({ x: midX, y: WORLD_HEIGHT * yf }));  // 미드필더 4
  FORWARD_Y_FRACTIONS.forEach((yf) => positions.push({ x: fwdX, y: WORLD_HEIGHT * yf })); // 공격수 2

  return positions.map((pos, i) => new FieldPlayer(pos.x, pos.y, team, i === humanIndex));
}

const blueTeam = new Team('blue', 1);
blueTeam.fieldPlayers = buildOutfield('blue', WORLD_WIDTH * 0.15, WORLD_WIDTH * 0.35, WORLD_WIDTH * 0.48, 8);
blueTeam.goalkeeper = new Goalkeeper(30, leftGoal.top, leftGoal.bottom, 'blue');
blueTeam.bench = [
  new FieldPlayer(WORLD_WIDTH * 0.48, WORLD_HEIGHT * 0.5, 'blue', false),
  new FieldPlayer(WORLD_WIDTH * 0.48, WORLD_HEIGHT * 0.5, 'blue', false),
  new FieldPlayer(WORLD_WIDTH * 0.48, WORLD_HEIGHT * 0.5, 'blue', false)
];

const redTeam = new Team('red', -1);
redTeam.fieldPlayers = buildOutfield('red', WORLD_WIDTH * 0.85, WORLD_WIDTH * 0.65, WORLD_WIDTH * 0.52, -1);
redTeam.goalkeeper = new Goalkeeper(WORLD_WIDTH - 30, rightGoal.top, rightGoal.bottom, 'red');
redTeam.bench = [
  new FieldPlayer(WORLD_WIDTH * 0.52, WORLD_HEIGHT * 0.5, 'red', false),
  new FieldPlayer(WORLD_WIDTH * 0.52, WORLD_HEIGHT * 0.5, 'red', false),
  new FieldPlayer(WORLD_WIDTH * 0.52, WORLD_HEIGHT * 0.5, 'red', false)
];

let goalFlashTimer = 0;
let lastGoalScorer = null;

const messageEl = document.getElementById('message');
let messageTimer = null;

function showMessage(text) {
  messageEl.textContent = text;
  messageEl.style.opacity = '1';
  if (messageTimer) clearTimeout(messageTimer);
  messageTimer = setTimeout(() => { messageEl.style.opacity = '0'; }, 2200);
}

// 게임 시간을 분:초 형식으로 변환
function getGameTimeDisplay() {
  const elapsedFrames = gameFrameCount % FRAMES_PER_HALF;
  const elapsedSeconds = Math.floor(elapsedFrames / FPS);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function resetKickoff() {
  ball.reset();
  ball.owner = null;

  for (const p of [...blueTeam.fieldPlayers, ...redTeam.fieldPlayers]) {
    p.x = p.homeX;
    p.y = p.homeY;
    p.hasBall = false;
    p.dirX = p.team === 'blue' ? 1 : -1;
    p.dirY = 0;
  }

  blueTeam.goalkeeper.y = (leftGoal.top + leftGoal.bottom) / 2;
  redTeam.goalkeeper.y = (rightGoal.top + rightGoal.bottom) / 2;
}

// 매 프레임 공에서 가장 가까운 선수를 찾아 소유권을 넘긴다. (태클/획득 처리 겸용)
function updatePossession() {
  const allField = [...blueTeam.fieldPlayers, ...redTeam.fieldPlayers];

  let candidate = null;
  let minDist = Infinity;

  for (const p of allField) {
    const d = dist(p, ball);
    if (d < PLAYER_CONTROL_RANGE && d < minDist) {
      minDist = d;
      candidate = p;
    }
    p.hasBall = false;
  }

  if (candidate) {
    candidate.hasBall = true;
    ball.owner = candidate;
  } else {
    ball.owner = null;
  }
}

function checkGoals() {
  const insideLeftGoalY = ball.y > leftGoal.top && ball.y < leftGoal.bottom;
  const insideRightGoalY = ball.y > rightGoal.top && ball.y < rightGoal.bottom;

  if (ball.x + ball.radius < 0 && insideLeftGoalY) {
    redTeam.score += 1;
    lastGoalScorer = 'RED';
    goalFlashTimer = 60;
    showMessage('GOAL! RED');
    resetKickoff();
    return;
  }

  if (ball.x - ball.radius > WORLD_WIDTH && insideRightGoalY) {
    blueTeam.score += 1;
    lastGoalScorer = 'BLUE';
    goalFlashTimer = 60;
    showMessage('GOAL! BLUE');
    resetKickoff();
  }
}

// C: 사람이 조작하는 선수를 공에 가장 가까운 아군 선수로 전환한다.
function trySwitchControl() {
  const human = blueTeam.fieldPlayers.find((p) => p.isHuman);
  if (!human) return;

  let best = null;
  let bestDist = Infinity;
  for (const p of blueTeam.fieldPlayers) {
    if (p === human) continue;
    const d = dist(p, ball);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }

  if (best) {
    human.isHuman = false;
    best.isHuman = true;
    showMessage('선수 전환');
  }
}

// R: 블루팀에서 체력이 가장 낮은 선수(사람 제외)를 후보 선수로 교체한다.
function trySubstitute() {
  if (blueTeam.subsRemaining <= 0) {
    showMessage('교체 카드를 모두 사용했습니���');
    return;
  }
  if (blueTeam.bench.length === 0) {
    showMessage('교체할 후보 선수가 없습니다');
    return;
  }

  let tiredest = null;
  let minStamina = Infinity;
  for (const p of blueTeam.fieldPlayers) {
    if (p.isHuman) continue;
    if (p.stamina < minStamina) {
      minStamina = p.stamina;
      tiredest = p;
    }
  }
  if (!tiredest) return;

  const fresh = blueTeam.bench.shift();
  fresh.x = tiredest.x;
  fresh.y = tiredest.y;
  fresh.homeX = tiredest.homeX;
  fresh.homeY = tiredest.homeY;
  fresh.stamina = 100;
  fresh.dirX = tiredest.dirX;
  fresh.dirY = tiredest.dirY;
  fresh.isHuman = false;

  const idx = blueTeam.fieldPlayers.indexOf(tiredest);
  blueTeam.fieldPlayers[idx] = fresh;

  blueTeam.subsRemaining -= 1;
  document.getElementById('subsInfo').textContent = `교체 ${blueTeam.subsRemaining}회 남음`;
  showMessage('선수 교체 완료');
}

function updateCamera() {
  const human = blueTeam.fieldPlayers.find((p) => p.isHuman) || blueTeam.fieldPlayers[0];
  const targetX = human.x - VIEW_WIDTH / 2;
  const targetY = human.y - VIEW_HEIGHT / 2;

  camera.x = Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH, targetX));
  camera.y = Math.max(0, Math.min(WORLD_HEIGHT - VIEW_HEIGHT, targetY));
}

function updateStaminaUI() {
  const human = blueTeam.fieldPlayers.find((p) => p.isHuman);
  if (!human) return;
  const fill = document.getElementById('staminaFill');
  const pct = Math.round(human.stamina);
  fill.style.width = `${pct}%`;
  fill.style.background = pct < 30 ? '#e53935' : pct < 60 ? '#ffca28' : '#66bb6a';
}

function update() {
  // 게임이 끝났으면 업데이트 안 함
  if (matchEnded) return;

  // 프레임 카운트 증가
  gameFrameCount += 1;

  // 전반/후반 체크
  if (gameFrameCount === FRAMES_PER_HALF) {
    currentHalf = 2;
    gameFrameCount = FRAMES_PER_HALF;
    showMessage('[HALFTIME] 후반전 시작!');
    resetKickoff();
    return; // 하프타임에는 플레이 멈춤
  }

  // 전체 경기 시간 종료 체크
  if (gameFrameCount >= FRAMES_PER_HALF * 2) {
    matchEnded = true;
    showMessage(`[MATCH END] BLUE ${blueTeam.score} : ${redTeam.score} RED`);
    return;
  }

  if (consumeSwitch()) trySwitchControl();
  if (consumeSubstitute()) trySubstitute();

  if (goalFlashTimer > 0) {
    goalFlashTimer -= 1;
    return;
  }

  updatePossession();
  const ownerTeamName = ball.owner ? ball.owner.team : null;

  // ---- 블루팀 (사람 1명 + AI 9명) ----
  for (const p of blueTeam.fieldPlayers) {
    if (p.isHuman) {
      p.moveByInput(Input, WORLD_WIDTH, WORLD_HEIGHT);

      if (p.hasBall) {
        if (consumeShoot()) {
          p.shoot(ball);
        } else if (consumePass()) {
          const target = bestPassTarget(p, blueTeam.fieldPlayers, redTeam.fieldPlayers);
          if (target) {
            p.passTo(ball, target);
          } else {
            p.dribble(ball);
          }
        } else {
          p.dribble(ball);
        }
      } else {
        consumeShoot();
        consumePass();
      }
    } else if (p.hasBall) {
      decideOwnerAction(p, ball, blueTeam.fieldPlayers, redTeam.fieldPlayers, WORLD_WIDTH, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT);
    } else {
      decideSupportAction(p, ball, blueTeam.fieldPlayers, ownerTeamName, WORLD_WIDTH, WORLD_HEIGHT);
    }
  }

  // ---- 레드팀 (전원 AI, 왼쪽 골대를 노림) ----
  for (const p of redTeam.fieldPlayers) {
    if (p.hasBall) {
      decideOwnerAction(p, ball, redTeam.fieldPlayers, blueTeam.fieldPlayers, 0, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT);
    } else {
      decideSupportAction(p, ball, redTeam.fieldPlayers, ownerTeamName, WORLD_WIDTH, WORLD_HEIGHT);
    }
  }

  blueTeam.goalkeeper.update(ball);
  redTeam.goalkeeper.update(ball);

  ball.update(WORLD_WIDTH, WORLD_HEIGHT, leftGoal, rightGoal);

  resolveKeeperCollision(blueTeam.goalkeeper, ball);
  resolveKeeperCollision(redTeam.goalkeeper, ball);
  resolvePlayerSeparation([
    ...blueTeam.fieldPlayers,
    ...redTeam.fieldPlayers,
    blueTeam.goalkeeper,
    redTeam.goalkeeper
  ]);

  checkGoals();
  updateCamera();
  updateStaminaUI();
}

function draw() {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  // 카메라 위치만큼 world를 화면 반대 방향으로 옮겨서, 카메라가 보는 영역만 캔버스에 그려지게 한다.
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  drawField(ctx, WORLD_WIDTH, WORLD_HEIGHT, leftGoal, rightGoal);

  blueTeam.goalkeeper.draw(ctx);
  redTeam.goalkeeper.draw(ctx);

  for (const p of blueTeam.fieldPlayers) p.draw(ctx);
  for (const p of redTeam.fieldPlayers) p.draw(ctx);

  ball.draw(ctx);

  ctx.restore();

  // 이 아래부터는 화면(뷰포트) 고정 좌표계 - 카메라 이동과 무관하게 그린다.
  if (goalFlashTimer > 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`GOAL! (${lastGoalScorer})`, VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
  }

  drawMinimap(ctx, blueTeam, redTeam, ball, camera, WORLD_WIDTH, WORLD_HEIGHT, VIEW_WIDTH, VIEW_HEIGHT);
  drawScore(blueTeam.score, redTeam.score, currentHalf, getGameTimeDisplay(), matchEnded);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
