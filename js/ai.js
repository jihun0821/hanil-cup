// 컴퓨터가 조작하는 선수들의 의사결정을 담당하는 모듈.
// 사람이 조작하는 선수는 절대 여기를 거치지 않는다 (game.js에서 입력으로 직접 처리).

const AI_SHOOT_RANGE = 620;
const AI_PRESSURE_RANGE = 70;
const AI_PASS_MAX_RANGE = 700;

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function nearestTo(point, list) {
  let best = null;
  let bestDist = Infinity;
  for (const p of list) {
    const d = dist(point, p);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

// 패스할 대상을 고른다: 너무 멀지 않고, 상대에게 마크되지 않은 선수를 우선한다.
function bestPassTarget(owner, teammates, opponents) {
  let best = null;
  let bestScore = -Infinity;

  for (const mate of teammates) {
    if (mate === owner) continue;

    const d = dist(owner, mate);
    if (d > AI_PASS_MAX_RANGE) continue;

    const nearestOpp = nearestTo(mate, opponents);
    const oppDist = nearestOpp ? dist(mate, nearestOpp) : 9999;
    if (oppDist < 50) continue; // 상대에게 붙잡힌 선수는 패스 대상에서 제외

    // 공격 방향으로 전진해 있을수록 좋은 패스 대상으로 취급한다.
    const advance = owner.team === 'blue' ? mate.x : -mate.x;
    const score = advance - d * 0.1;

    if (score > bestScore) {
      bestScore = score;
      best = mate;
    }
  }

  return best;
}

// 공을 가진 AI 선수의 행동 (슛 / 패스 / 드리블)
function decideOwnerAction(owner, ball, teammates, opponents, goalX, goalCenterY, fieldWidth, fieldHeight) {
  const distToGoal = Math.abs(goalX - owner.x);
  const nearestOpp = nearestTo(owner, opponents);
  const pressured = nearestOpp && dist(owner, nearestOpp) < AI_PRESSURE_RANGE;

  if (distToGoal < AI_SHOOT_RANGE && !pressured) {
    const dx = goalX - owner.x;
    const dy = goalCenterY - owner.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    owner.dirX = dx / len;
    owner.dirY = dy / len;
    owner.shoot(ball);
    return;
  }

  if (pressured) {
    const target = bestPassTarget(owner, teammates, opponents);
    if (target) {
      owner.passTo(ball, target);
      return;
    }
  }

  // 압박이 없거나 패스할 곳이 없으면 골대 방향으로 드리블
  owner.moveToward(goalX, goalCenterY, fieldWidth, fieldHeight, owner.speed);
  owner.dribble(ball);
}

// 공을 가지지 않은 AI 선수의 포지셔닝
// ownerTeam: 'blue' | 'red' | null(루즈볼)
function decideSupportAction(player, ball, teammates, ownerTeam, fieldWidth, fieldHeight) {
  if (ownerTeam === player.team) {
    // 우리 팀이 공격 중: 앞쪽 지원 위치로 이동
    const advance = player.team === 'blue' ? 130 : -130;
    player.moveToward(player.homeX + advance, player.homeY, fieldWidth, fieldHeight, player.speed * 0.8);
    return;
  }

  // 상대가 공을 가졌거나(수비) 루즈볼 상황: 우리 팀 중 가장 가까운 1명만 쫓는다.
  const closest = nearestTo(ball, teammates);
  if (player === closest) {
    player.moveToward(ball.x, ball.y, fieldWidth, fieldHeight);
  } else {
    player.moveToward(player.homeX, player.homeY, fieldWidth, fieldHeight, player.speed * 0.8);
  }
}
