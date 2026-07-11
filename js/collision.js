// 충돌 처리 모듈: 골키퍼 선방, 선수끼리 겹침 방지.

function resolveKeeperCollision(keeper, ball) {
  const dx = ball.x - keeper.x;
  const dy = ball.y - keeper.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDist = keeper.radius + ball.radius;

  if (distance < minDist && distance > 0) {
    const nx = dx / distance;
    const ny = dy / distance;

    ball.x = keeper.x + nx * minDist;
    ball.y = keeper.y + ny * minDist;

    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    ball.vx = nx * Math.max(speed, 6);
    ball.vy = ny * Math.max(speed, 6);
  }
}

// 필드 플레이어들이 서로 완전히 겹치지 않도록 살짝 밀어낸다.
function resolvePlayerSeparation(players) {
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;

      if (distance < minDist && distance > 0) {
        const overlap = (minDist - distance) / 2;
        const nx = dx / distance;
        const ny = dy / distance;

        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
      }
    }
  }
}
