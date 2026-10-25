import type { TodoItem } from '../../data/model';
import { formatDateKey, offsetDateKey } from './todoModel';

const ARCHIVE_DEMO_YEARS = [2022, 2023, 2024, 2025];
const ARCHIVE_DEMO_MONTHS = ['03', '06', '09', '12'];
const ARCHIVE_DEMO_RECORDS = [
  ['08', 'Atlas 전원 시퀀스 측정 및 보드 초기 구동 검증'],
  ['12', '센서 수집 인터페이스 테스트와 SDK 예제 정리'],
  ['18', 'OTA 롤백 시나리오 회귀 테스트 완료'],
  ['24', '릴리스 산출물 검증 및 변경 사항 문서화'],
];

export function createArchiveDemoTodos(): TodoItem[] {
  return ARCHIVE_DEMO_YEARS.flatMap(year => ARCHIVE_DEMO_MONTHS.flatMap(month =>
    ARCHIVE_DEMO_RECORDS.map(([day, text]) => {
      const date = `${year}-${month}-${day}`;
      return { id: `demo-archive-${date}`, text, createdAtDate: date, completedAtDate: date, done: true };
    }),
  ));
}

export function createDemoTodos(todayKey: string = formatDateKey()): TodoItem[] {
  const d18 = offsetDateKey(todayKey, -18);
  const d14 = offsetDateKey(todayKey, -14);
  const d11 = offsetDateKey(todayKey, -11);
  const d8 = offsetDateKey(todayKey, -8);
  const d5 = offsetDateKey(todayKey, -5);
  const d3 = offsetDateKey(todayKey, -3);
  const d2 = offsetDateKey(todayKey, -2);
  const d1 = offsetDateKey(todayKey, -1);

  const m1_d1 = offsetDateKey(todayKey, -26);
  const m1_d2 = offsetDateKey(todayKey, -31);
  const m1_d3 = offsetDateKey(todayKey, -36);
  const m1_d4 = offsetDateKey(todayKey, -41);
  const m1_d5 = offsetDateKey(todayKey, -46);

  const m2_d1 = offsetDateKey(todayKey, -56);
  const m2_d2 = offsetDateKey(todayKey, -62);
  const m2_d3 = offsetDateKey(todayKey, -68);
  const m2_d4 = offsetDateKey(todayKey, -74);

  return [
    ...createArchiveDemoTodos(),
    {
      id: 'todo-1',
      text: 'Atlas A1 저전력 복귀 시나리오 전류 파형 재측정',
      createdAtDate: d3,
      done: false,
    },
    {
      id: 'todo-2',
      text: 'OTA 롤백 테스트 보드 점퍼 핀 배열 최종 확인',
      createdAtDate: d1,
      done: false,
    },
    {
      id: 'todo-3',
      text: 'BLE 연결 끊김 복구 전략 투트랙 실험',
      createdAtDate: todayKey,
      done: false,
    },
    {
      id: 'todo-3-a',
      parentId: 'todo-3',
      text: 'A안: Fast Advertising 인터벌 단축 재연결 측정',
      createdAtDate: todayKey,
      done: true,
      completedAtDate: todayKey,
    },
    {
      id: 'todo-3-b',
      parentId: 'todo-3',
      text: 'B안: Supervision Timeout 4s 연장 안정성 실험',
      createdAtDate: todayKey,
      done: false,
    },
    {
      id: 'todo-4',
      text: '신규 리비전 PCB 전원 시퀀스 오실로스코프 캡처',
      createdAtDate: todayKey,
      done: false,
    },

    // Completed today (shown at bottom of current list with strikethrough)
    {
      id: 'todo-5',
      text: '릴리스 2.4.0 바이너리 SHA-256 체크섬 검증',
      createdAtDate: todayKey,
      done: true,
      completedAtDate: todayKey,
    },
    {
      id: 'todo-6',
      text: '오전 빌드 큐 대기열 상태 점검',
      createdAtDate: d1,
      done: true,
      completedAtDate: todayKey,
    },

    // Current month past days history
    {
      id: 'todo-7',
      text: 'UART 진단 로그 누락 재현 조건 문서화',
      createdAtDate: d3,
      done: true,
      completedAtDate: d1,
    },
    {
      id: 'todo-8',
      text: 'BLE 광고 패킷 인터벌 튜닝 값 적용',
      createdAtDate: d1,
      done: true,
      completedAtDate: d1,
    },
    {
      id: 'todo-9',
      text: 'Atlas A2 워치독 타이머 타임아웃 임계치 조정',
      createdAtDate: d2,
      done: true,
      completedAtDate: d2,
    },
    {
      id: 'todo-10',
      text: '플래시 파티션 테이블 오프셋 계산 스크립트 수정',
      createdAtDate: d3,
      done: true,
      completedAtDate: d2,
    },
    {
      id: 'todo-11',
      text: '주간 펌웨어 빌드 타겟 브랜치 동기화',
      createdAtDate: d3,
      done: true,
      completedAtDate: d3,
    },
    {
      id: 'todo-12',
      text: 'Nova N1 디버그 프로파일 심볼 테이블 크기 점검',
      createdAtDate: d5,
      done: true,
      completedAtDate: d5,
    },
    {
      id: 'todo-13',
      text: '초기 부트로더 CRC 검증 루틴 코드 리뷰',
      createdAtDate: d8,
      done: true,
      completedAtDate: d5,
    },
    {
      id: 'todo-14',
      text: '개발 환경 시리얼 모니터 보드레이트 프리셋 정리',
      createdAtDate: d8,
      done: true,
      completedAtDate: d8,
    },
    {
      id: 'todo-15',
      text: 'I2C 버스 클럭 스트레칭 예외 처리 로직 추가',
      createdAtDate: d11,
      done: true,
      completedAtDate: d11,
    },
    {
      id: 'todo-16',
      text: '센서 폴링 태스크 스택 오버플로 워터마크 확인',
      createdAtDate: d14,
      done: true,
      completedAtDate: d11,
    },
    {
      id: 'todo-17',
      text: '테스트 지그 펌웨어 자동 플래싱 배치 파일 작성',
      createdAtDate: d14,
      done: true,
      completedAtDate: d14,
    },
    {
      id: 'todo-18',
      text: 'RTOS 태스크 우선순위 테이블 정리 및 공유',
      createdAtDate: d18,
      done: true,
      completedAtDate: d18,
    },

    // Previous month (-1 month) history
    {
      id: 'todo-19',
      text: '슬립 모드 진입 전 GPIO 누설 전류 차단 설정',
      createdAtDate: m1_d2,
      done: true,
      completedAtDate: m1_d1,
    },
    {
      id: 'todo-20',
      text: 'SPI DMA 전송 완료 인터럽트 핸들러 최적화',
      createdAtDate: m1_d1,
      done: true,
      completedAtDate: m1_d1,
    },
    {
      id: 'todo-21',
      text: '배터리 잔량 ADC 캘리브레이션 커브 테이블 보정',
      createdAtDate: m1_d2,
      done: true,
      completedAtDate: m1_d2,
    },
    {
      id: 'todo-22',
      text: 'OTA 이미지 서명 키 교체 테스트 수행',
      createdAtDate: m1_d3,
      done: true,
      completedAtDate: m1_d3,
    },
    {
      id: 'todo-23',
      text: '하드웨어 리비전 B 핀맵 변경점 드라이버 반영',
      createdAtDate: m1_d4,
      done: true,
      completedAtDate: m1_d3,
    },
    {
      id: 'todo-24',
      text: '메모리 덤프 추출용 Python 파서 스크립트 개선',
      createdAtDate: m1_d4,
      done: true,
      completedAtDate: m1_d4,
    },
    {
      id: 'todo-25',
      text: '부트 로고 디스플레이 초기화 타이밍 단축',
      createdAtDate: m1_d5,
      done: true,
      completedAtDate: m1_d5,
    },

    // Two months ago (-2 months) history
    {
      id: 'todo-26',
      text: '외부 크리스탈 오실레이터 안정화 대기 시간 측정',
      createdAtDate: m2_d1,
      done: true,
      completedAtDate: m2_d1,
    },
    {
      id: 'todo-27',
      text: '초기 보드 브링업 체크리스트 템플릿 생성',
      createdAtDate: m2_d2,
      done: true,
      completedAtDate: m2_d1,
    },
    {
      id: 'todo-28',
      text: '프로토타입 보드 열화상 카메라 발열 포인트 기록',
      createdAtDate: m2_d2,
      done: true,
      completedAtDate: m2_d2,
    },
    {
      id: 'todo-29',
      text: 'JTAG 디버거 드라이버 및 오픈오씨디 환경 구성',
      createdAtDate: m2_d3,
      done: true,
      completedAtDate: m2_d3,
    },
    {
      id: 'todo-30',
      text: '신규 MCU SDK 레퍼런스 매뉴얼 레지스터 맵 정리',
      createdAtDate: m2_d4,
      done: true,
      completedAtDate: m2_d4,
    },
  ];
}
