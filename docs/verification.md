# 검증 기록

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
