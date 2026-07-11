// 고급 물리 엔진: 공의 이동, 마찰, 회전, 충돌 시뮬레이션

class Physics {
  constructor() {
    this.gravity = 0; // 2D 게임이므로 수직 중력 없음
    this.friction = 0.96; // 공의 마찰 계수
    this.airResistance = 0.98; // 공기 저항
  }

  // 공의 속도 업데이트: 마찰과 공기 저항 적용
  updateBallVelocity(ball) {
    // 마찰 적용
    ball.vx *= this.friction;
    ball.vy *= this.friction;

    // 공기 저항 적용
    ball.vx *= this.airResistance;
    ball.vy *= this.airResistance;

    // 아주 작은 속도는 0으로 처리 (오버플로우 방지)
    if (Math.abs(ball.vx) < 0.01) ball.vx = 0;
    if (Math.abs(ball.vy) < 0.01) ball.vy = 0;
  }

  // 공과 벽의 충돌 (탄성 충돌)
  handleBallWallCollision(ball, fieldWidth, fieldHeight, leftGoal, rightGoal) {
    // 위/아래 벽 충돌
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy *= -0.7; // 반발 계수
    }
    if (ball.y + ball.radius > fieldHeight) {
      ball.y = fieldHeight - ball.radius;
      ball.vy *= -0.7;
    }

    // 좌측 벽 (블루팀 골대 제외)
    const insideLeftGoalY = ball.y > leftGoal.top && ball.y < leftGoal.bottom;
    if (!insideLeftGoalY && ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx *= -0.7;
    }

    // 우측 벽 (레드팀 골대 제외)
    const insideRightGoalY = ball.y > rightGoal.top && ball.y < rightGoal.bottom;
    if (!insideRightGoalY && ball.x + ball.radius > fieldWidth) {
      ball.x = fieldWidth - ball.radius;
      ball.vx *= -0.7;
    }
  }

  // 공과 선수의 충돌: 선수가 공을 찬다
  // 충돌 시 공에 힘을 전달하되, 선수의 방향과 속도를 고려
  handlePlayerBallCollision(player, ball) {
    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = player.radius + ball.radius;

    if (distance < minDist && distance > 0) {
      const nx = dx / distance;
      const ny = dy / distance;

      // 공을 선수 밖으로 밀어냄
      ball.x = player.x + nx * minDist;
      ball.y = player.y + ny * minDist;

      // 선수의 움직임이 공에 전달됨 (드리블 효과)
      const playerSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy) || 0;
      const ballSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) || 0;

      // 공의 속도가 선수 속도보다 느리면, 선수 방향으로 가속
      if (ballSpeed < playerSpeed * 0.8) {
        ball.vx = nx * playerSpeed * 0.5;
        ball.vy = ny * playerSpeed * 0.5;
      }
    }
  }

  // 선수 간 충돌: 겹치지 않도록 분리
  handlePlayerPlayerCollision(players) {
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
}

const physics = new Physics();
