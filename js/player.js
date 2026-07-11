// 필드 플레이어 클래스.
// 사람이 조작하는 선수와 AI가 조작하는 선수를 하나의 클래스로 통일해서 다룬다.
// 4단계부터 체력(스태미나) 시스템이 추가되어, 계속 움직이면 속도가 서서히 줄고
// 멈춰있으면 서서히 회복된다.
class FieldPlayer {
  constructor(x, y, team, isHuman) {
    this.x = x;
    this.y = y;
    this.homeX = x; // 공을 쫓지 않을 때 돌아갈 기본 위치 (포메이션 위치)
    this.homeY = y;

    this.team = team;       // 'blue' 또는 'red'
    this.isHuman = isHuman;

    this.radius = 16;
    this.baseSpeed = 4;
    this.speed = this.baseSpeed; // 체력에 따라 매 프레임 재계산되는 실제 속도

    this.stamina = 100;
    this.staminaMax = 100;

    this.dirX = team === 'blue' ? 1 : -1;
    this.dirY = 0;

    this.hasBall = false;
  }

  // moving: 이번 프레임에 실제로 이동을 시도했는지 여부
  updateStaminaAndSpeed(moving) {
    if (moving) {
      this.stamina = Math.max(0, this.stamina - 0.08);
    } else {
      this.stamina = Math.min(this.staminaMax, this.stamina + 0.15);
    }
    // 체력이 0이어도 최소 60% 속도는 유지 (완전히 멈추면 게임이 안 풀리므로)
    this.speed = this.baseSpeed * (0.6 + 0.4 * (this.stamina / this.staminaMax));
  }

  // 사람 입력에 따라 이동시킨다. (공 소유 여부와 무관하게 항상 입력대로 움직인다)
  moveByInput(input, worldWidth, worldHeight) {
    let moveX = 0;
    let moveY = 0;

    if (input.up) moveY -= 1;
    if (input.down) moveY += 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    const moving = moveX !== 0 || moveY !== 0;
    this.updateStaminaAndSpeed(moving);

    if (moving) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= len;
      moveY /= len;
      this.dirX = moveX;
      this.dirY = moveY;
    }

    this.x += moveX * this.speed;
    this.y += moveY * this.speed;
    this.clamp(worldWidth, worldHeight);
  }

  // 목표 지점을 향해 스스로 이동한다. (AI용)
  moveToward(targetX, targetY, worldWidth, worldHeight, speedOverride) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const moving = distance > 2;

    this.updateStaminaAndSpeed(moving);
    const speed = speedOverride !== undefined ? speedOverride : this.speed;

    if (moving) {
      const nx = dx / distance;
      const ny = dy / distance;
      this.dirX = nx;
      this.dirY = ny;
      this.x += nx * speed;
      this.y += ny * speed;
    }

    this.clamp(worldWidth, worldHeight);
  }

  clamp(worldWidth, worldHeight) {
    this.x = Math.max(this.radius, Math.min(worldWidth - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(worldHeight - this.radius, this.y));
  }

  dribble(ball) {
    const DRIBBLE_DISTANCE = this.radius + ball.radius + 4;
    const targetX = this.x + this.dirX * DRIBBLE_DISTANCE;
    const targetY = this.y + this.dirY * DRIBBLE_DISTANCE;

    ball.vx = (targetX - ball.x) * 0.3;
    ball.vy = (targetY - ball.y) * 0.3;
  }

  shoot(ball) {
    const SHOOT_POWER = 13;
    ball.vx = this.dirX * SHOOT_POWER;
    ball.vy = this.dirY * SHOOT_POWER;
  }

  passTo(ball, targetPlayer) {
    const PASS_POWER = 10;
    const dx = targetPlayer.x - this.x;
    const dy = targetPlayer.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    ball.vx = (dx / dist) * PASS_POWER;
    ball.vy = (dy / dist) * PASS_POWER;

    this.dirX = dx / dist;
    this.dirY = dy / dist;
  }

  // world 좌표 기준으로 그린다. (game.js에서 카메라 위치만큼 ctx를 translate 해둔 상태에서 호출됨)
  draw(ctx) {
    const isBlue = this.team === 'blue';

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = isBlue
      ? (this.isHuman ? '#1e88e5' : '#64b5f6')
      : (this.isHuman ? '#e53935' : '#ef9a9a');
    ctx.fill();
    ctx.strokeStyle = isBlue ? '#0d47a1' : '#7f0000';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.isHuman) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.dirX * (this.radius + 6), this.y + this.dirY * (this.radius + 6));
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 체력이 낮으면 머리 위에 작은 경고 점 표시
    if (this.stamina < 30) {
      ctx.beginPath();
      ctx.arc(this.x, this.y - this.radius - 8, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffca28';
      ctx.fill();
    }
  }
}
