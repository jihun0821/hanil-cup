function drawField(ctx, worldWidth, worldHeight, leftGoal, rightGoal) {
  const stripeCount = 24;
  const stripeWidth = worldWidth / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#2e7d32' : '#33871c';
    ctx.fillRect(i * stripeWidth, 0, stripeWidth, worldHeight);
  }

  ctx.strokeStyle = '#eaffea';
  ctx.lineWidth = 3;

  // 바깥 테두리
  ctx.strokeRect(10, 10, worldWidth - 20, worldHeight - 20);

  // 중앙선 + 중앙 원
  ctx.beginPath();
  ctx.moveTo(worldWidth / 2, 10);
  ctx.lineTo(worldWidth / 2, worldHeight - 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(worldWidth / 2, worldHeight / 2, 90, 0, Math.PI * 2);
  ctx.stroke();

  // 왼쪽 골대 (블루팀이 수비)
  ctx.fillStyle = '#9e9e9e';
  ctx.fillRect(0, leftGoal.top, 10, leftGoal.bottom - leftGoal.top);
  ctx.strokeRect(0, leftGoal.top, 10, leftGoal.bottom - leftGoal.top);
  ctx.strokeRect(10, leftGoal.top - 30, 90, (leftGoal.bottom - leftGoal.top) + 60);

  // 오른쪽 골대 (레드팀이 수비)
  ctx.fillRect(worldWidth - 10, rightGoal.top, 10, rightGoal.bottom - rightGoal.top);
  ctx.strokeRect(worldWidth - 10, rightGoal.top, 10, rightGoal.bottom - rightGoal.top);
  ctx.strokeRect(worldWidth - 100, rightGoal.top - 30, 90, (rightGoal.bottom - rightGoal.top) + 60);
}

function drawScore(blueScore, redScore) {
  const el = document.getElementById('score');
  el.textContent = `BLUE ${blueScore} : ${redScore} RED`;
}

// 화면 우측 상단에 작은 미니맵을 그려 전체 경기장에서 현재 보이는 영역을 표시한다.
function drawMinimap(ctx, blueTeam, redTeam, ball, camera, worldWidth, worldHeight, viewWidth, viewHeight) {
  const miniW = 170;
  const miniH = miniW * (worldHeight / worldWidth);
  const padding = 10;
  const originX = viewWidth - miniW - padding;
  const originY = padding;
  const scale = miniW / worldWidth;

  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = 'rgba(10, 20, 10, 0.75)';
  ctx.fillRect(originX, originY, miniW, miniH);
  ctx.strokeStyle = '#eaffea';
  ctx.lineWidth = 1;
  ctx.strokeRect(originX, originY, miniW, miniH);

  const dot = (x, y, color, r) => {
    ctx.beginPath();
    ctx.arc(originX + x * scale, originY + y * scale, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  for (const p of blueTeam.fieldPlayers) dot(p.x, p.y, p.isHuman ? '#1e88e5' : '#90caf9', p.isHuman ? 2.5 : 1.6);
  for (const p of redTeam.fieldPlayers) dot(p.x, p.y, '#ef5350', 1.6);
  dot(blueTeam.goalkeeper.x, blueTeam.goalkeeper.y, '#0d47a1', 1.6);
  dot(redTeam.goalkeeper.x, redTeam.goalkeeper.y, '#7f0000', 1.6);
  dot(ball.x, ball.y, '#ffffff', 2);

  // 현재 카메라(보이는 영역) 표시
  ctx.strokeStyle = '#ffca28';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(originX + camera.x * scale, originY + camera.y * scale, viewWidth * scale, viewHeight * scale);

  ctx.restore();
}
