// 키 입력 상태를 전역으로 관리한다.
// 4단계 조작: 이동(방향키) / Z 패스 / X 슛 / C 선수 전환 / R 교체
const Input = {
  up: false,
  down: false,
  left: false,
  right: false,
  pass: false,
  shoot: false,
  switchPlayer: false,
  substitute: false,
  _passLatch: false,
  _shootLatch: false,
  _switchLatch: false,
  _subLatch: false
};

window.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'ArrowUp': Input.up = true; break;
    case 'ArrowDown': Input.down = true; break;
    case 'ArrowLeft': Input.left = true; break;
    case 'ArrowRight': Input.right = true; break;
    case 'KeyZ':
      if (!Input._passLatch) {
        Input.pass = true;
        Input._passLatch = true;
      }
      break;
    case 'KeyX':
    case 'Space':
      if (!Input._shootLatch) {
        Input.shoot = true;
        Input._shootLatch = true;
      }
      e.preventDefault();
      break;
    case 'KeyC':
      if (!Input._switchLatch) {
        Input.switchPlayer = true;
        Input._switchLatch = true;
      }
      break;
    case 'KeyR':
      if (!Input._subLatch) {
        Input.substitute = true;
        Input._subLatch = true;
      }
      break;
  }
});

window.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'ArrowUp': Input.up = false; break;
    case 'ArrowDown': Input.down = false; break;
    case 'ArrowLeft': Input.left = false; break;
    case 'ArrowRight': Input.right = false; break;
    case 'KeyZ': Input._passLatch = false; break;
    case 'KeyX':
    case 'Space': Input._shootLatch = false; break;
    case 'KeyC': Input._switchLatch = false; break;
    case 'KeyR': Input._subLatch = false; break;
  }
});

// 게임 루프에서 한 번 소비하고 나면 꺼주는 헬퍼들 (연사 방지)
function consumeShoot() {
  const wasPressed = Input.shoot;
  Input.shoot = false;
  return wasPressed;
}

function consumePass() {
  const wasPressed = Input.pass;
  Input.pass = false;
  return wasPressed;
}

function consumeSwitch() {
  const wasPressed = Input.switchPlayer;
  Input.switchPlayer = false;
  return wasPressed;
}

function consumeSubstitute() {
  const wasPressed = Input.substitute;
  Input.substitute = false;
  return wasPressed;
}
