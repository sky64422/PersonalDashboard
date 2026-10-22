import { DEMO_USER_ID, type Task, type Build, type FirmwareArtifact } from './model';

const taskRows = [
  ['FW-284', '부팅 시퀀스 타이밍 최적화', 'Atlas Firmware', 'In Progress', 'High', '10:42', '전원 인가부터 서비스 준비까지의 부팅 시퀀스를 점검합니다. 초기화 단계별 지연을 측정하고 병렬화 가능한 작업을 정리해주세요.'],
  ['FW-279', 'OTA 업데이트 롤백 시나리오 검증', 'Atlas Firmware', 'In Review', 'High', '09:30', '업데이트 중 전원 차단, 이미지 손상, 버전 불일치 상황에서 이전 버전으로 안전하게 복구되는지 확인합니다.'],
  ['SDK-142', '센서 데이터 수집 인터페이스 개선', 'Nova SDK', 'In Progress', 'Medium', '09:15', '센서별 샘플링 주기와 버퍼 인터페이스를 정리하고 SDK 사용 예제를 업데이트합니다.'],
  ['FW-271', '저전력 모드 복귀 시 연결 안정화', 'Atlas Firmware', 'To Do', 'High', '08:55', '저전력 모드에서 복귀할 때 연결 재협상 흐름을 검토합니다. 재현 조건과 검증 결과를 기록해주세요.'],
  ['SDK-138', '디바이스 로그 포맷 표준화', 'Nova SDK', 'In Review', 'Medium', '08:20', '진단에 필요한 공통 로그 필드와 오류 레벨을 문서화하고 예제 출력을 검토합니다.'],
  ['FW-265', '릴리스 체크리스트 업데이트', 'Atlas Firmware', 'To Do', 'Low', '08:10', '다음 릴리스의 검증 범위, 산출물 목록과 변경 사항을 정리합니다.'],
  ['SDK-130', '통신 프로토콜 문서 검토', 'Nova SDK', 'Done', 'Low', '07:50', '문서 검토를 마쳤습니다. Closed로 전환되기 전까지 내 업무 목록에 표시됩니다.'],
  ['FW-261', '테스트 보드 설정 점검', 'Atlas Firmware', 'To Do', 'Medium', '07:30', '검증용 보드의 환경 설정과 테스트 준비 상태를 확인합니다.'],
] as const;
export const demoTasks: Task[] = taskRows.map(([key, title, project, status, priority, time, description]) => ({
  id: key, key, title, project, status, priority, description, assigneeId: DEMO_USER_ID, updatedAt: `2026-10-22T${time}:00+09:00`,
}));
demoTasks.push(
  { ...demoTasks[0], id: 'FW-200', key: 'FW-200', title: '종료된 예시 업무', status: 'Closed' },
  { ...demoTasks[0], id: 'FW-201', key: 'FW-201', title: '다른 담당자의 예시 업무', assigneeId: 'demo-other' },
);
export const BUILD_TARGETS = ['Atlas A1', 'Atlas A2', 'Nova N1'];
export const BUILD_PROFILES = ['Release', 'Debug'];
export const demoBuilds: Build[] = [
  { id: 'BLD-1042', target: 'Atlas A1', branch: 'release/2.4.0', profile: 'Release', status: 'Success', createdAt: '2026-10-22T10:32:00+09:00', duration: '4m 32s', demo: true },
  { id: 'BLD-1041', target: 'Nova N1', branch: 'develop', profile: 'Debug', status: 'Success', createdAt: '2026-10-22T09:45:00+09:00', duration: '3m 18s', demo: true },
  { id: 'BLD-1040', target: 'Atlas A2', branch: 'feature/low-power', profile: 'Debug', status: 'Failed', createdAt: '2026-10-22T09:10:00+09:00', duration: '1m 47s', demo: true },
  { id: 'BLD-1039', target: 'Atlas A1', branch: 'main', profile: 'Release', status: 'Success', createdAt: '2026-10-21T17:40:00+09:00', duration: '4m 08s', demo: true },
];
export const demoFirmware: FirmwareArtifact[] = [
  { id: 'artifact-1', filename: 'atlas_a1_2.4.0_release.bin', model: 'Atlas A1', version: '2.4.0', branch: 'release/2.4.0', buildId: 'BLD-1042', path: 'C:\\FolioDemo\\firmware\\atlas_a1\\2.4.0\\atlas_a1_2.4.0_release.bin', size: '24.8 MB', createdAt: '2026-10-22' },
  { id: 'artifact-2', filename: 'nova_n1_1.8.2_debug.bin', model: 'Nova N1', version: '1.8.2', branch: 'develop', buildId: 'BLD-1041', path: 'C:\\FolioDemo\\firmware\\nova_n1\\1.8.2\\nova_n1_1.8.2_debug.bin', size: '18.2 MB', createdAt: '2026-10-22' },
  { id: 'artifact-3', filename: 'atlas_a1_2.3.9_release.bin', model: 'Atlas A1', version: '2.3.9', branch: 'main', buildId: 'BLD-1039', path: 'C:\\FolioDemo\\firmware\\atlas_a1\\2.3.9\\atlas_a1_2.3.9_release.bin', size: '24.6 MB', createdAt: '2026-10-21' },
  { id: 'artifact-4', filename: 'atlas_a2_2.3.8_release.bin', model: 'Atlas A2', version: '2.3.8', branch: 'release/2.3.8', buildId: 'BLD-1037', path: 'C:\\FolioDemo\\firmware\\atlas_a2\\2.3.8\\atlas_a2_2.3.8_release.bin', size: '26.1 MB', createdAt: '2026-10-20' },
];
