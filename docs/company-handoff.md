# 회사 환경 연동 가이드

## 현재 경계

`src/App.tsx`가 화면 상태와 데모 빌드 목록을 소유합니다. `src/data/model.ts`는 UI에 필요한 도메인 타입, `src/data/demo.ts`는 가상 데이터입니다. 기능별 디렉터리는 검색 정책과 화면을 함께 관리합니다. `src-tauri/src/main.rs`는 창 생명주기만 담당하며 아직 회사 API 명령은 없습니다.

UI를 바꾸지 않고 실제 데이터를 붙이려면 **샘플 데이터 공급과 동작 호출을 먼저 교체**하세요. 사내 API 응답을 화면 전체로 퍼뜨리지 말고 `Task`, `Build`, `FirmwareArtifact`에 매핑하는 코드를 해당 기능의 Rust/TypeScript 경계에 두세요. 현재 도메인의 `demo: true`는 샘플임을 보장하는 타입이므로 실제 연동 시 명시적인 데이터 모드와 실제 응답 타입으로 변경해야 합니다.

## Jira

1. 회사 Jira 종류, 인증 방식, 내 account ID/username, 프로젝트별 실제 상태명을 확인합니다.
2. Rust 비동기 명령에서 API 조회·페이지 수집을 수행하고 UI 모델로 변환합니다.
3. 모든 화면에서 **assignee = 현재 사용자**입니다. My Tasks 보드는 Closed를 포함하고, Overview와 통합 검색은 Closed를 제외합니다. `statusCategory != Done`으로 바꾸면 Resolved 업무까지 누락됩니다. `TASK_COLUMNS`는 To Do → Open, In Progress/In Review → Progress, Done → Resolved, Closed → Closed로 그룹화합니다. 실제 Jira 상태명에 맞게 이 매핑을 교체하세요.
4. 실제로 Closed에 해당하는 상태가 여러 개면 매핑 정책을 명시하고 테스트를 추가합니다. Jira에서 Task 타입만 필요한지, Story/Bug 등도 포함할지 확인합니다. 현재 샘플은 일반 업무 목록이며 이슈 타입 API 필터는 구현하지 않았습니다.
5. 네트워크 실패를 빈 업무 목록으로 치환하지 마세요. 로딩·빈 결과·오류·마지막 갱신 시각을 구분합니다.

숨기기는 `friday.hidden-task-ids`에 이슈 ID 목록을 저장하는 로컬 표시 설정입니다. Jira 상태를 수정하지 않으며 홈·통합 검색에도 반영합니다. 보드의 **숨긴 업무**에서 복원할 수 있습니다. 회사 연동 시 계정/서버별 저장 범위를 정하고 안정적인 이슈 ID를 사용하세요. 저장 실패는 현재 세션에서만 적용되었다고 알립니다.

## Build system

`Builds.tsx`의 확인 UI 이후 호출되는 `App.submitBuild`가 현재 데모 삽입 지점입니다. 실제 작업에서는 이 함수를 Rust 호출로 교체하고 서버의 job ID와 응답 상태를 저장하세요.

- 대상/브랜치/프로필은 사내 시스템의 유효한 선택지로 교체합니다.
- 제출 중 중복 클릭 차단과 실패 상태를 유지합니다. 서버가 지원하면 idempotency key를 사용합니다.
- 제출 타임아웃은 서버에서 이미 시작됐을 수 있으므로 자동 재시도하지 않습니다. job 조회로 결과를 확인하는 정책을 정합니다.
- 이 UI의 Queued/Success/Failed는 시각 예제입니다. 실제 Building/Cancelled 등은 시스템 상태에 맞춰 확장합니다.
- 완료로 보이게 하는 가짜 진행률·시간 기반 완료 전환을 추가하지 않습니다.

## Firmware

API 검색인지 공유 폴더/UNC 경로 검색인지 먼저 정합니다. 후자라면 접근 권한, 허용 루트, 검색 범위와 취소 동작을 설계한 후 Rust 비동기 명령/작업으로 구현합니다. UI 스레드에서 디렉터리를 순회하지 마세요.

`Firmware.tsx`의 입력/필터는 `filterFirmware`를 호출합니다. 실제 데이터량이 커지면 서버 또는 Rust 측에서 검색·페이지 처리를 하고 가상화는 측정된 필요에 따라 추가합니다.

현재 `C:\FridayDemo\...`는 가상의 경로입니다. 경로 복사는 실제 클립보드 동작이지만 다운로드나 탐색기 열기는 제공하지 않습니다. 실제 경로가 연결될 때 검증된 파일/폴더 열기 명령을 추가합니다.

제품 표시 이름은 Friday입니다. 기존 사용자 설정을 유지하기 위해 내부 앱 식별자 `com.personaldashboard.folio`와 테마 저장 키 `folio.theme`는 호환성을 유지합니다. 이를 바꿀 때는 기존 데이터 디렉터리와 설정 마이그레이션이 필요합니다.

## 설정과 인증

현재 설정 화면은 연결 전 상태 안내와 움직임 옵션만 제공합니다. 실제 연결 설정 UI는 회사에서 구현합니다. 자격 증명을 프런트엔드 번들, `VITE_*`, localStorage, 소스·로그에 넣지 마세요. Rust 쪽에서 회사가 허용하는 자격 증명 저장소/SSO를 사용하고 필요한 Tauri capabilities만 추가합니다.

## UI 및 애니메이션 유지 원칙

- **불필요한 세컨더리 라벨이나 설명을 피한다. 레이아웃으로 설명을 전달한다.**
- `src/styles.css`의 duration/easing 토큰을 사용합니다.
- Windows의 reduced-motion 및 앱의 움직임 줄이기 설정을 함께 존중합니다. Portal도 `html[data-reduced-motion]` 규칙에 포함됩니다.
- 복사→체크는 실제 성공 후에만 표시합니다. 실패를 성공처럼 처리하지 않습니다.
- 반복 타이머·장식 루프·상시 rAF가 없습니다. 새 폴링은 창 가시성과 연계하고 중복 요청/취소를 처리하세요.
- 출처는 `THIRD_PARTY_NOTICES.md`와 해당 코드 주석에 남겼습니다.

## 개발 시 유용한 위치

| 변경 | 위치 |
| --- | --- |
| 업무 의미/정렬 | `src/features/tasks/filter.ts` |
| 빌드 입력 검증 | `src/features/builds/validation.ts` |
| 펌웨어 검색 | `src/features/firmware/filter.ts` |
| 데이터 타입/공통 상태 | `src/data/model.ts` |
| 화면 조합/상태 | `src/App.tsx` |
| 색상/간격/모션 | `src/styles.css` |
| 팝업 접근성/포커스 복귀 | `src/components/ui.tsx` |
| 통합 검색/방향키 | `src/components/GlobalSearch.tsx` |
| Rust 명령 등록 | `src-tauri/src/main.rs` |

React UI는 브라우저에서도 실행되므로 연동 추가 시 native/browser 실행 경계를 명확히 하세요. 실제 연결 실패 시 샘플 데이터로 조용히 대체하지 마세요.

### Jira 보드 모션

Lucian UX/UI Prompt [#251](https://lucianlabs.dev/uxui-prompt/#251)의 순차 등장과 [#317](https://lucianlabs.dev/uxui-prompt/#317)의 정렬 이동을 참고해 `useBoardMotion.ts`를 독립 구현했습니다. 원본 코드 복사나 새 의존성은 없습니다. 카드는 260ms 동안 transform/opacity로 움직이고 등장 지연은 최대 110ms입니다. 정렬·숨기기 뒤 위치 이동을 보간하며 유휴 반복 작업은 없습니다. Windows 및 앱의 움직임 줄이기에서는 생략합니다.
