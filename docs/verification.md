# 검증 기록

## 구조 리팩터링 — 2026-10-26

- 범위: To-Do 편집/히스토리/홈 미리보기 분리, 상태·저장 훅 추출, 계층 인덱스와 재귀 행 통합, 샘플/스토리지/히스토리 모델 분리, 공통 검색, 천체 계산 분리, 사용하지 않는 테마 토큰·compact 분기·이미지 제거.
- 변경 전: `npm test` 36개, `npm run test:ui` 32개, `npm run build` 통과.
- 변경 후: `npm test` 36개, `npm run test:ui -- --workers=1` 34개(47.5초), 타입 검사와 프로덕션 빌드 통과. 새 테스트는 종료 직전 편집 flush, 계층 변경 시 최신 텍스트 보존, 화면 이동 중 지연 저장, 저장 실패 알림을 확인한다.
- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`, `npm run tauri -- build --no-bundle` 통과. Rust 릴리즈 컴파일 종료 및 실행 파일 생성을 확인했다.
- 네이티브: 별도 WebView2 프로필에서 `node scripts/native-smoke.mjs`, `node scripts/native-theme-smoke.mjs` 통과. 뷰포트 1440×960, 페이지 오류 0, 다섯 뷰 이동·To-Do 저장/검색·숨김 복원·상세 포커스·양 테마를 검증했다. 스크린샷은 `tmp/screenshots/native-*.png`에 보관한다.
- 검증 중 발견: 기존 Vite 프로세스가 이동 전 모듈 경로를 캐시하여 첫 UI 실행이 실패했다. 서버 재시작 후 해소했다. 이후 병렬 실행은 33/34 통과했고 OS 클립보드 성공 테스트 하나가 실패했다. 해당 테스트 단독 실행 및 전체 순차 실행은 모두 통과했으며 원인을 앱 코드 회귀로 단정하지 않았다.
- 기존 네이티브 스크립트의 제거된 홈 필터 선택자와 과거 테마 색상 기대값을 현재 UI/브라우저 테스트에 맞췄다. To-Do 삭제 버튼은 숨김 창에서도 실제 키보드 focus/Enter 경로로 검사한다.
- 독립 코드 리뷰에서 Critical/Important 지적 없음. 주석 위치와 EOF 공백 지적은 확인 후 정리했다. 저장 로딩의 기존 샘플 fallback 및 계층 데이터 검증 정책은 변경하지 않았다.
- 제품 소스(TS/TSX/CSS) 7,042 → 6,879줄, 미사용 이미지 500,930바이트 제거. 문서/테스트/파일 분할을 포함한 변경량과 제품 소스 감소량을 구분했다.

## To-Do History 검색 기능 및 Overview Bento 레이아웃 정렬 — 2026-10-26

- **1안 스마트 필터링 타임라인 검색**:
  - History 헤더 우측 슬림 캡슐 검색창 (`Esc` 및 `✕` 원클릭 지우기 지원).
  - 검색 모드 전환 시 연/월 피커를 검색 결과 상태 바로 대체하고 일치 기록 일수 표시 (`"검색어" 관련 N일치 기록 발견`).
  - 전체 누적 이력에서 일치하는 일별 로그(`searchDailyTodoLog`)만 타임라인에 필터링 렌더링.
  - 메모 카드 본문 매칭 키워드에 `<mark class="history-search-match">` 테마별 하이라이트 적용.
  - 다년도 검색 식별을 위한 연도 뱃지(`2022년`, `2026년` 등) 카드 헤더 자동 부착.
- **Overview Bento 그리드 및 정렬 개선**:
  - FairyTaleSky 파노라마 히어로를 전체 폭으로 배치하고 시간대별 천체 일러스트 적용.
  - 중앙 To-Do 카드와 우측 Firmware 카드의 하단 끝선을 일치시키고, 내용 증가 시 내부 스크롤바가 생기도록 레이아웃 고정.
  - Jira Tasks 하단 전체 폭 배치 및 불필요한 상태 필터 버튼 제거.
- **디자인 시스템 및 테마 디테일 폴리싱**:
  - 메모 카드 모서리 반경을 `border-radius: 16px`로 완화하여 대시보드 전체의 둥글둥글한 UI 톤과 조화.
  - To-Do 완료 항목 취소선(strikethrough) 제거로 시각적 가독성 개선.
  - 미드나잇 다크 모드의 티타늄 메탈 클립 핀, 체크박스 명도, 레이어 깊이감 최적화.
  - 데이터가 없는 비활성화된 월(month) 버튼 대비 및 알약 컨테이너 가시성 복원.
- **검증 결과**:
  - `npm test`: 36개 단위 테스트 전체 통과 (`tests/celestial.test.ts`, `tests/domain.test.ts`).
  - `npm run test:ui`: 32개 Playwright E2E UI 테스트 전체 통과 (`tests/ui/history-search.spec.ts`, `tests/ui/overview-layout.spec.ts` 포함).
  - `npm run build`: TypeScript 컴파일 및 Vite 프로덕션 빌드 성공.

## 시간대 배경과 네 영역의 시각적 통일 — 2026-10-25

- Midnight에서도 아침은 따뜻한 회청색 하늘과 녹회색 산, 오후는 청회색 하늘로 표현한다. 밤은 기존 어두운 달빛 배경을 유지한다. 고정 시계로 09/15/23시를 각각 캡처해 확인했다 (`tmp/screenshots/overview-period-*.png`).
- Jira/To-Do/빌드/펌웨어에 공통 상단 경계·페이드 표면·20px 안쪽 여백·17px 헤더를 적용했다. 높이가 다른 두 흐름은 유지하며 To-Do 상한은 680px에서 500px로 줄였다.
- `npm run test:ui -- --workers=2`: 30개, `npm test`: 20개 통과. 프런트엔드 빌드, Rust format, Windows production 빌드 통과.
- 실제 production WebView2에서 두 테마·네 화면·상세·검색·숨김 복원·테마 저장 복원을 검증했다. 두 native smoke 스크립트 통과, pageerror 0건. 최종 native 캡처를 검토하고 검증 앱을 종료했다.

## Overview 콘텐츠·레이아웃 최종 조정 — 2026-10-25

- Hero는 날짜·인사·풍경만 표시한다. 상단 날짜 배지, Hero 필박스, 포커스 강조 영역, 네비게이션 4개를 제거했다. 높이는 데스크톱에서 200~240px이며 풍경 채도/불투명도를 낮추고 얇은 유리 테두리를 유지했다.
- 동일한 카드 4개 대신 왼쪽에 열린 업무·빌드 목록, 오른쪽에 To-Do 카드와 펌웨어 검색을 배치했다. 좁은 창은 업무 → To-Do → 빌드 → 펌웨어 순서를 유지한다.
- 기본 업무 목록은 미완료 업무를 우선순위순으로 보여준다. 높은 데스크톱 창은 업무 5개·빌드 3개, 낮은 창은 3개·2개다. 1280×1360에서 하단 펌웨어 끝이 1200px 아래에 위치하는지 검사했다.
- `npm run test:ui -- --workers=2`: 30개 통과. `npm test`: 20개 통과. 프런트엔드 빌드, Rust format, `npm run tauri -- build --no-bundle` 통과.
- 브라우저 두 테마의 1440×960, 1280×1360, 900×960, 800×960 화면을 캡처했다. 가로 넘침과 pageerror 0건. 새 레이아웃 검사는 기존 카드 테두리와 부족한 업무 노출로 먼저 실패하는 것을 확인한 뒤 통과했다.
- 별도 프로필의 production WebView2 1440×960에서 두 테마와 날짜 배치, 상세 열기, 탐색, 숨김 복원, 검색, 테마 저장 복원을 확인했다. `node scripts/native-smoke.mjs`, `node scripts/native-theme-smoke.mjs` 통과, pageerror 0건. 검증 앱은 종료했다.
- 최종 캡처: `tmp/screenshots/overview-aligned-web-*.png`, `tmp/screenshots/overview-aligned-native-*.png`.

## 사이드바 종이 질감 및 Overview 균형 개선 — 2026-10-24

- 사이드바에 불규칙한 종이 주름 이미지를 낮은 대비로 적용했다. Daylight는 무채색의 밝은 배경, Midnight는 기존 차콜 질감을 유지한다.
- My workspace는 박스 없는 작은 설정 바로가기로 낮추고, 선택 탭은 Daylight 차콜 / Midnight 브라스 채움으로 구분한다. 선택 글자 대비 4.5:1 이상, 이동 표시 정렬, 축소 메뉴를 검증했다.
- Overview는 현황 요약 줄, My tasks / To-Do, Recent builds / Firmware의 두 열 구조다. 포커스 업무를 My tasks 안으로 옮겼고 긴 To-Do는 패널 내부에서 스크롤한다.
- UI 테스트 30개, 단위 테스트 20개, 프런트엔드 빌드, Rust format 및 Windows production 빌드 통과. 긴 목록 추가·완료, 두 열의 시작/끝선과 하단 카드 위치, 800px 단일 열 전환을 검사했다.
- 두 테마를 1440/1280/900/800px에서 캡처해 검토했다. 가로 넘침과 pageerror 0건. 900px 이상, 높이 960px에서 하단 카드까지 한 화면에 들어간다.
- 별도 WebView2 프로필의 실제 production 앱에서 탐색, 업무 상세, 검색, 숨김 복원, 테마 전환 및 저장 복원을 확인했다. 1440×960에서 가로 넘침과 pageerror 0건. 검증 프로세스는 종료했다.
- 독립 코드 리뷰에서 Important/Critical 문제 없음.

## To-Do UI/UX 현대화 및 톤다운 앤틱 골드 다크 테마 개편 — 2026-10-24

- **키보드 중심 To-Do 입력**: 불필요한 `+ 할 일 추가` 버튼을 제거하고, Enter 키 즉시 등록 및 Tab 키 하위 계층화 지원. 입력창은 포커스 시 앤틱 골드 링으로 시각적 피드백 제공.
- **인터랙션 노이즈 억제**: 삭제 버튼(`.todo-delete-btn`)을 평소에는 숨기고 행 호버/포커스 시 부드럽게 노출. 드래그 앤 드롭 정렬 핸들(`GripVertical`)을 추가하고 `reorderTodos` 로직을 구현하여 할 일 순서 재배치 지원.
- **레이아웃 밀도 및 3-Way 뷰 모드**:
  - `전체 뷰` / `할 일 집중` / `히스토리` 모드 세그먼트 스위치 도입.
  - 히스토리 접기/펼치기 토글 및 전체 기록 수 배지(`${activeEntries.length}일 기록`) 제공.
  - 아날로그 집게 메타포(`.hanging-clip`)를 제거하고 모던 타임라인 카드 스타일로 정돈.
  - 좌/우 스크롤 내비게이션 버튼(`.history-stage-scroll-btn.prev`, `.next`)으로 마우스 휠 외에도 부드러운 카드 탐색 지원.
- **Anti-AI 다크 모드 컬러 개편**:
  - 생성형 AI 특유의 네온 사이버 퍼플/시안 발광 효과를 배제하고, 차분한 **톤다운 앤틱 브라스/골드 (`#cca04b`)**를 핵심 악센트로 채택.
  - 날짜가 지난 미완료 작업의 이월 배지(`.carried-badge`)는 테라코타 러스트(`rgba(215, 85, 35, 0.15)`, `#e07a4a`)로 구분.
- **검증 결과**:
  - `npm test`: 20개 도메인 단위 테스트 통과 (드래그 재정렬, 이월 로직 포함).
  - `npm run test:ui`: 27개 Playwright E2E 테스트 전체 통과 (레이아웃, 키보드 입력, 다크 테마).
  - `npm run build`: TypeScript 타입 체크 및 Vite 프로덕션 빌드 성공.

## 기록 수와 무관한 월 선택 배치 — 2026-10-24

- 월 선택은 항상 1~12월을 표시한다. 기록 없는 월은 비활성화하고 툴팁에 기록 없음을 표시한다. 월 드래그와 가장자리 페이드는 제거했으며 연도 드래그는 유지한다.
- 800/1440px에서 1월만, 10월까지, 12월까지의 데이터로 모든 월 버튼의 상대 좌표와 크기가 같은지 확인했다. 좁은 영역은 6칸 두 줄, 넓은 영역은 12칸 한 줄이다.
- 도메인 테스트 19개, UI 테스트 27개와 프런트엔드 빌드가 통과했다.

## 대량 히스토리 가독성과 탐색 보완 — 2026-10-24

- 일별 카드는 기본 5개 기록을 표시하고 ‘외 N개 더 보기’/‘접기’로 전체 기록을 탐색한다. 배지 개수는 전체 기록 기준이다. 펼치기 버튼은 카드 드래그를 시작하지 않는다.
- ‘오늘’을 연도 옆으로 옮기고 36px 높이의 보라색 버튼으로 강조했다. 현재 월의 최신 기록으로 이동한다는 툴팁과 기록이 없을 때의 동작을 명시했다.
- 월 선택에 실제 좌우 넘침에 따라 달라지는 가장자리 페이드를 적용했다. 드래그·크기 변경 시 갱신하고 ResizeObserver/이벤트는 해제한다.
- `LATEST`는 ‘이달 마지막 기록’으로 변경했다. 기존 일별 기록 정책(오늘 이전 기록 표시)은 유지한다.
- 같은 대량 샘플의 최대 카드 높이가 약 604px에서 367px로 감소했다. 800/900/1440px 가로 넘침 0px. 밝은/어두운 테마 캡처를 검토했다.
- `npm test`: 18개 통과. `npm run test:ui`: 26개 통과. 펼치기/접기, 전체 기록 수, 드래그 충돌 방지, 페이드 양끝 및 너비 변경, 오늘 버튼 배치를 검증했다. 프런트엔드 빌드와 Rust format 검사 통과.
- Windows production 빌드 성공. 별도 WebView2 프로필의 대량 샘플에서 오늘 이동, 카드 펼치기/접기, 변경된 날짜 배지를 확인했다. 가로 넘침 없음, pageerror 0건이며 테스트 프로세스는 종료했다.

## 연도 선택과 오늘 버튼 강조 — 2026-10-24

- 연도 선택을 15px 글자와 입체적인 선택 배경을 갖춘 그룹으로 변경했다. ‘오늘’은 오른쪽 끝에서 연도 바로 옆으로 옮기고 보라색 채움과 흰 글자로 강조했다.
- 밝은/어두운 테마 및 900/1440/2560px 화면을 캡처해 검토했다. 가로 넘침 0px, pageerror 0건. 월 드래그와 오늘 복귀를 포함한 UI 테스트 24개, 도메인 테스트 18개와 프런트엔드 빌드가 통과했다.

## 연도/월 분리와 드래그 탐색 — 2026-10-24

- 월 선택을 상단 연도, 하단 월 카드로 분리했다. 두 선택 줄은 스크롤바를 숨기고 마우스 드래그, 터치 스크롤 및 키보드 Tab/Enter 선택을 유지한다.
- 연도·월·일별 기록 모두 과거→최근 방향으로 통일했다. 이전/다음/최근으로 버튼을 없애고 기간 선택 영역에 ‘오늘’을 배치했다. 현재 월 기록이 없으면 가장 최근 기록으로 이동한다.
- 드래그 임계값과 pointer capture로 카드 클릭과 드래그를 구분하며, 드래그 직후 월이 바뀌지 않는 것을 회귀 검사했다. 선택된 월은 선택 줄 안으로 자동 이동한다.
- `npm test`: 18개, `npm run test:ui`: 24개 통과. 프런트엔드 빌드와 Rust format 검사 통과. 900px/1440px 대량 샘플의 기간 선택 및 카드 캡처를 직접 검토했다.
- Windows production 빌드 성공. 별도 프로필의 실제 WebView2에서 ‘오늘’ 이동과 가로 넘침 없음, pageerror 0건을 확인하고 테스트 프로세스를 종료했다.

## 월 선택 카드 및 대량 히스토리 미리보기 — 2026-10-24

- 월 선택은 달력 아이콘과 기록 일수를 갖춘 라벤더 카드로 정리했다. 선택 상태는 얇은 테두리, 은은한 표면과 그림자로 구분하며 Midnight도 대응한다.
- `/?todoHistory=large`에서 2020년 1월 1일부터 어제까지 하루 3~7개의 완료 기록을 추가한다. 2026년 10월 기준 7개 연도와 82개월을 탐색할 수 있다. 연도는 드래그해서 이동하며 월은 기록 수와 무관하게 1~12월 고정 격자(넓은 영역 12칸, 720px 이하 6칸 두 줄)로 표시한다. 기록 없는 월은 비활성화한다. 1월만 있는 경우, 10월까지, 12월까지의 버튼 좌표가 동일한지 UI 테스트로 검증한다.
- 미리보기는 기존 저장 데이터를 읽거나 덮어쓰지 않으며 편집은 현재 화면에서만 적용된다. 저장 데이터 보존과 대량 월 선택 회귀 검사를 추가했다.
- 900px에서 가장 오래된 월까지 선택하고 페이지 가로 넘침이 없음을 확인했다. 월이 많을 때 월 선택 자체는 내부 가로 스크롤로 탐색한다.

## To-Do 반응형 레이아웃 개선 — 2026-10-24

- 히스토리의 콘텐츠 최소 너비가 상위 그리드를 확장하던 문제를 `minmax(0, 1fr)`과 축소 가능한 섹션으로 수정했다. 본문 최대 너비는 1400px이며 가로 스크롤은 히스토리 안에서만 발생한다.
- 할 일 목록은 내용에 따라 높이가 늘어나고 화면 높이 기반 상한을 넘을 때만 내부 스크롤한다. 새 할 일 입력과 추가 버튼은 목록 스크롤 밖에 유지한다.
- 히스토리의 기존 최근 기록 자동 이동을 유지하고 이전·다음·최근으로 버튼을 추가했다. 밝은/어두운 테마의 그림자와 확대 효과를 낮추고 기록 본문을 13px로 조정했다.
- 수정 전 회귀 검사에서 1440px / 2560px / 900px 화면의 가로 넘침 898px / 137px / 1281px를 재현했다. 수정 후 세 화면 모두 페이지 가로 넘침 0px를 확인했다.
- `npm test`: 18개 통과. `npm run test:ui`: 22개 통과. 짧은 목록의 하위 항목 노출, 긴 목록의 내부 스크롤과 입력란 유지, 히스토리 이동 및 버튼 추가를 포함한다.
- `npm run build`, `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`, `npm run tauri -- build --no-bundle` 통과.
- 세 화면 크기와 Midnight 캡처를 직접 검토했다. 900×700에서는 페이지 세로 스크롤로 히스토리에 접근한다.
- 별도 임시 WebView2 프로필로 production 실행 파일을 검사했다. `http://tauri.localhost/`에서 가로 넘침 없음, 이전·최근 기록 이동, pageerror 0건을 확인하고 테스트 앱을 종료했다. 캡처는 `tmp/screenshots/todos-*.png`에 저장했다.

2026-10-23, Windows 11, production build.

| 검사 | 결과 |
|---|---|
| `npm test` | 10개 통과 |
| `npm run test:ui` | Edge 브라우저 UI 테스트 9개 통과 |
| `npm run build` | TypeScript 및 Vite 빌드 성공 |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | 통과 |
| `npm run tauri -- build --no-bundle` | Windows release 실행 파일 생성 성공 |
| `node scripts/native-smoke.mjs` | 실제 WebView2에서 네 화면 탐색, 업무 상세, Escape 및 포커스 복귀, 통합 검색, 스크롤 통과. pageerror 0 |

브라우저에서는 1440×960, 900×700에서 가로 넘침을 검사했다. 복사 성공/거부, 공백 검색, 초기화, 빌드 검토 취소 및 중복 제출 방지, 키보드 검색, 시스템/앱 움직임 줄이기를 검사했다.

네이티브 앱은 `http://tauri.localhost/`의 production 자산으로 검사했다. 첫 화면 1440×960, DPI 96. Windows 창을 916×739로 줄여 아이콘 사이드바와 내용 스크롤을 직접 확인했으며 최소화/복원도 통과했다. 다른 DPI 배율은 미검증이다.

## 리소스 관측

AMD Ryzen 5 9600X, 논리 프로세서 12개, NVIDIA RTX 5070. 시스템 보고 주사율은 144Hz다. production 앱과 부모 PID로 연결된 WebView2 하위 프로세스 총 7개의 합계:

- 전용 메모리: 194.1MB
- working set 합계: 358.2MB (공유 페이지 중복 집계 가능)
- 유휴 5초 동안 누적 CPU 시간 증가: 측정 해상도에서 0초

단일 장비의 짧은 유휴 관측이며 사용량 상한을 보장하지 않는다. 상호작용 부하 CPU와 프레임 타임, 144fps 유지율은 미측정이다. 지속 타이머·폴링·장식용 반복 애니메이션은 구현하지 않았다.

네이티브 자동 검사는 해당 프로세스에만 `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9227`를 지정해 시작한 뒤 실행한다. 일반 사용에는 지정하지 않는다. 검증 후 일반 실행 파일로 다시 열었다.

독립 코드 리뷰에서 검색 결과 상세창 종료 시 포커스 유실과 빌드 확인창 위 검색창 중첩을 발견해 수정했다. 각각 회귀 assertion을 추가했고 UI 테스트 8개가 다시 통과했다.

Gr8r Studio 데모를 실제 브라우저에서 검토한 뒤 Overview 업무 분류 전환을 독립 구현했다. 상태별 개수와 실제 목록, 상세 열기 회귀 검사를 추가해 최종 UI 테스트는 9개다. 기존 CSS 전환만 사용하며 런타임 의존성은 추가하지 않았다.

## Midnight 테마 — 2026-10-23

- 설정의 Daylight / Midnight 선택, 키보드 전환, 새로고침 후 복원, 저장 거부 시 알림을 검증했다. `npm run test:ui`: 11개 통과, `npm test`: 10개 통과.
- `npm run build`, Rust format 검사 및 `npm run tauri -- build --no-bundle` 성공.
- `node scripts/native-theme-smoke.mjs`: 실제 production WebView2에서 두 테마 전환, 저장 후 새로고침, 네 화면 및 상세 패널 배경 검사 통과. pageerror 0.
- 네 화면과 설정, 900×700 화면을 캡처해 직접 확인했다. 테마는 CSS로 적용하며 런타임 의존성·반복 타이머를 추가하지 않았다.

## 중성 팔레트 및 shadcn 참고 개선 — 2026-10-23

- 다크 테마의 보라색 장식·그라데이션을 차콜·스톤·아이보리로 교체했다. 상태 배지만 청록·황토·녹색·적갈색을 사용한다.
- 설정 스위치, 입력 그룹 포커스/오류, 검색 결과 그룹 및 스크롤, 검색어 지우기 후 포커스 복귀, 축소 사이드바의 접근 가능한 이름을 개선했다.
- `npm run test:ui`: 13개 통과. `npm test`: 10개 통과. 프런트엔드 빌드, Rust format, Windows production 빌드 성공.
- 독립 리뷰에서 Critical/Important 문제 없음. `node scripts/native-theme-smoke.mjs`: 실제 앱에서 테마·저장 복원·네 화면·상세 패널과 스위치 Space 전환, 검색 세 그룹 및 End 이동 스크롤 통과. pageerror 0.
- 다크 네 화면·설정·검색과 밝은 테마, 작은 창 캡처를 검토했다. 추가 런타임 의존성 없음.

## Friday 업무 보드와 숨김 설정 — 2026-10-23

- 표시 이름을 Friday로 변경했다. 앱 식별자와 기존 테마 키는 호환성을 유지한다.
- Open / Progress / Resolved / Closed 네 열에 내 업무를 배치한다. Overview 및 통합 검색은 Closed를 제외한다.
- 개별 카드와 상세 패널에서 로컬 숨기기/복원이 가능하다. 숨김은 홈·검색에도 반영되며 재로딩 후 유지된다. Jira 상태는 수정하지 않는다.
- Lucian #251/#317을 참고한 등장 및 위치 이동 모션을 독립 구현했다. 260ms transform/opacity, 최대 110ms 등장 지연이며 유휴 반복 작업이나 새 의존성은 없다.
- `npm run test:ui`: 17개 통과. `npm test`: 11개 통과. 숨김 저장/복원, 저장 거부, 열별 배치, 키보드 상세, 좁은 창, 모션 종료와 OS reduced-motion을 포함한다.
- 실제 화면 검토에서 숨김 토글 hover 대비 문제를 발견해 수정하고 해당 회귀 테스트 2개를 재실행해 통과했다.
- 밝은/어두운 보드, 900px 창과 숨긴 업무 화면을 캡처해 확인했다. 독립 리뷰에서 Critical/Important 문제 없음.
- production WebView2에서 Friday 페이지 이름, 네 열, 숨김·재로딩·복원과 테마 전환 검증 통과. pageerror 0. 프레임 유지율은 별도로 측정하지 않았다.

## 간결한 업무 보드 — 2026-10-23

- Linear/Plane 레퍼런스 검토 후 중복 헤더와 열별 설명을 제거하고 보드를 위로 올렸다.
- 카드는 이슈 키·제목·프로젝트·우선순위만 표시한다. 설명·담당자·업데이트 날짜는 상세 패널에서 확인한다. 숨기기는 이름과 툴팁을 갖춘 28px 아이콘 버튼이다.
- 카드 높이는 샘플 기준 약 134px이며 1440×960 화면에 9개 업무가 모두 표시된다. 라이트/다크 및 900px 창을 직접 캡처해 검토했다.
- UI 테스트 17개, 도메인 테스트 11개, 프런트엔드 빌드와 Rust format 검사 통과.

## 레이아웃 중심 UI 리라이트 및 To-Do 워크스페이스 — 2026-10-23

- **불필요한 세컨더리 라벨이나 설명을 피한다. 레이아웃으로 설명을 전달한다.** 원칙에 따라 앱 전반의 부제, 영문 eyebrow, 홍보성 배너/어사이드, 중복 캡션을 제거했다.
- To-Do 화면의 상단 할 일 목록을 2열 스크롤 그리드로 정돈하고, 하단 히스토리의 삼중 박스 중첩을 제거해 `2 : 8` 월별 카드와 빨래줄 스테이지가 직접 대비되도록 구성했다 (`1440×900` 뷰포트 내 수직 넘침 0px).
- 도메인 테스트 14개, UI 테스트 18개, 프런트엔드 프로덕션 빌드 통과.
# Hero five-period landscape — 2026-10-25

- Added fixed local-time dawn (04–06), morning (06–12), afternoon (12–16), sunset (16–19), night (19–04) scenes. Sunset has a lavender/apricot sky and low sun; dawn has blue ridge mist and a fading moon. Period selection retains the existing Overview mount-time evaluation.
- `npm test`: 33 passed, including 13 period-boundary and midnight-trajectory checks. `npm run test:ui -- --workers=2`: 30 passed.
- `npm run build`, `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`, and `npm run tauri -- build --no-bundle`: passed.
- Fixed-clock Edge captures verified all five scenes in both themes. Sunset at 800/900/1440px had no horizontal overflow; visually inspected sunset/dawn captures and narrow layout.
- Isolated production WebView2: native smoke and theme smoke passed with zero page errors; fixed-clock sunset rendering confirmed and inspected. Captures: `tmp/screenshots/hero-{period}-{theme}.png`, `tmp/screenshots/hero-sunset-native.png`.

## Solid Overview panels and convex Hero rim - 2026-10-25

- Removed the four panel fade gradients; applied continuous solid surfaces and borders. Work panels share a bounded row, with builds and firmware aligned in the utility row.
- Strengthened the Hero perimeter reflections and lower inner shadow without a central blur overlay.
- Passed: 33 unit tests, 30 UI tests (including aligned-row and solid-surface assertions), frontend build, Rust format check, and Tauri release build.
- Inspected both themes at 1440/1280/900/800px, the tall 1280x1360 layout, and night Hero bevel. Production WebView2 smoke, theme persistence and detail navigation passed with zero page errors; native screenshot inspected.
- Capture: `tmp/screenshots/overview-aligned-web-Midnight-1280.png`.
