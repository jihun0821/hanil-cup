class Ball {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 8;
    this.friction = 0.98;
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;
  }

  // leftGoal, rightGoal: { top, bottom } - 골대 라인 안쪽에서는 벽 튕김을 생략해서
  // 공이 골대 안으로 계속 들어갈 수 있게 한다.
  update(fieldWidth, fieldHeight, leftGoal, rightGoal) {
    this.x += this.vx;
    this.y += this.vy;

    this.vx *= this.friction;
    this.vy *= this.friction;

    if (Math.abs(this.vx) < 0.05) this.vx = 0;
    if (Math.abs(this.vy) < 0.05) this.vy = 0;

    // 위/아래 벽 충돌
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy *= -0.6;
    }
    if (this.y + this.radius > fieldHeight) {
      this.y = fieldHeight - this.radius;
      this.vy *= -0.6;
    }

    const insideLeftGoalY = this.y > leftGoal.top && this.y < leftGoal.bottom;
    const insideRightGoalY = this.y > rightGoal.top && this.y < rightGoal.bottom;

    if (!insideLeftGoalY && this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx *= -0.6;
    }
    if (!insideRightGoalY && this.x + this.radius > fieldWidth) {
      this.x = fieldWidth - this.radius;
      this.vx *= -0.6;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
