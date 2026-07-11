// 골키퍼 클래스. 좌/우 골대 어느 쪽에도 배치할 수 있도록 파라미터화되어 있다.
class Goalkeeper {
  constructor(x, goalTop, goalBottom, team) {
    this.x = x; // x는 고정 (자신의 골대 앞)
    this.y = (goalTop + goalBottom) / 2;
    this.goalTop = goalTop;
    this.goalBottom = goalBottom;
    this.radius = 16;
    this.speed = 3;
    this.team = team; // 'blue' 또는 'red'
  }

  update(ball) {
    const margin = this.radius;
    const targetY = Math.max(
      this.goalTop + margin,
      Math.min(this.goalBottom - margin, ball.y)
    );

    if (this.y < targetY) {
      this.y = Math.min(this.y + this.speed, targetY);
    } else if (this.y > targetY) {
      this.y = Math.max(this.y - this.speed, targetY);
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.team === 'blue' ? '#0d47a1' : '#7f0000';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
