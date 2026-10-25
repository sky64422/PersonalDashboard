import type { TodoItem } from '../../data/model';
import { offsetDateKey } from './todoModel';
import { createDemoTodos } from './demoTodos';

const HISTORY_START_DATE = '2020-01-01';
const MIN_ITEMS_PER_DAY = 3;
const ITEM_COUNT_VARIANTS = 5;
const CARRY_INTERVAL = 4;
const CARRY_DAYS = 2;
const HISTORY_SUBJECTS = [
  'Atlas A1 저전력 복귀 전류 파형 측정',
  'Nova N1 OTA 업데이트 및 롤백 시나리오 검증',
  'BLE 장시간 연결 안정성 테스트 결과 정리',
  '센서 데이터 수집 주기와 타임스탬프 오차 분석',
  '부트로더 이미지 서명 및 체크섬 검증',
  '신규 PCB 리비전 전원 시퀀스 캡처',
  'UART 진단 로그 누락 재현 및 오류 복구 코드 리뷰',
  '릴리스 후보 펌웨어 회귀 테스트와 변경 사항 문서화',
  'RTOS 태스크 스택 사용량 측정',
  '테스트 지그 자동 플래싱 및 결과 리포트 개선',
];

export function createLargeHistoryDemo(todayKey: string): TodoItem[] {
  const history: TodoItem[] = [];
  for (let day = 1; ; day++) {
    const completedAtDate = offsetDateKey(todayKey, -day);
    if (completedAtDate < HISTORY_START_DATE) break;
    const carriedFromDate = offsetDateKey(completedAtDate, -CARRY_DAYS);
    const itemCount = MIN_ITEMS_PER_DAY + day % ITEM_COUNT_VARIANTS;
    for (let item = 0; item < itemCount; item++) {
      history.push({
        id: `history-preview-${day}-${item}`,
        text: `${HISTORY_SUBJECTS[(day + item) % HISTORY_SUBJECTS.length]} · ${item + 1}차`,
        createdAtDate: item % CARRY_INTERVAL === 0 && carriedFromDate >= HISTORY_START_DATE ? carriedFromDate : completedAtDate,
        done: true,
        completedAtDate: completedAtDate,
      });
    }
  }
  return [...createDemoTodos(todayKey), ...history];
}
