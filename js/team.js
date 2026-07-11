// 팀 데이터를 관리하는 컨테이너.
// 실제 이동/AI 로직은 FieldPlayer, ai.js에 있고
// 여기서는 팀 단위 정보(점수, 공격 방향, 선수 목록, 후보 선수, 교체 횟수)만 다룬다.
class Team {
  constructor(name, attackDir) {
    this.name = name;          // 'blue' 또는 'red'
    this.attackDir = attackDir; // +1: 오른쪽으로 공격, -1: 왼쪽으로 공격
    this.score = 0;

    this.fieldPlayers = [];    // FieldPlayer[] - 현재 필드 위에 있는 10명 (골키퍼 제외)
    this.goalkeeper = null;    // Goalkeeper

    this.bench = [];           // FieldPlayer[] - 대기 중인 후보 선수
    this.subsRemaining = 3;    // 실제 축구 규칙을 참고한 교체 가능 횟수
  }

  allPlayers() {
    return this.goalkeeper ? [...this.fieldPlayers, this.goalkeeper] : this.fieldPlayers;
  }
}
