# 시스템 아키텍처 (System Architecture)

Friday(Personal Dashboard)는 Windows 11 환경을 타깃으로 하는 데스크톱 개인 엔지니어링 대시보드 애플리케이션입니다.
본 문서는 프로젝트의 전체 구조, 상태 관리 흐름, UI/UX 아키텍처 및 Tauri 네이티브 바운더리를 설명합니다.

---

## 1. 기술 스택 개요

| 레이어 | 기술 | 역할 |
|---|---|---|
| **데스크톱 호스트** | Tauri 2 (Rust) | 네이티브 윈도우 생성, 생명주기 관리, 향후 사내 시스템 및 로컬 파일시스템/인증 통합 바운더리 |
| **렌더러 엔진** | Microsoft WebView2 | Windows 11 네이티브 WebView 기반 렌더링 |
| **프런트엔드 코어** | React 19, TypeScript | 컴포넌트 기반 UI 구성 및 상태 관리 |
| **빌드 & 번들러** | Vite 8, Rolldown runtime | 초고속 HMR 개발 서버 및 경량 프로덕션 번들링 |
| **스타일링** | Tailwind CSS v4, CSS Variables | 시맨틱 디자인 토큰 기반 라이트/다크(Midnight) 테마 |
| **접근성 UI 프리미티브** | Radix UI (`@radix-ui/react-dialog`) | 키보드 내비게이션, 포커스 트랩 및 복귀를 보장하는 모달 다이얼로그 |
| **아이콘** | Lucide React | 일관된 모던 UI 아이콘 셋 |
| **테스트 프레임워크** | Vitest, Playwright | 단위 도메인 로직 검증 및 헤드리스 브라우저 E2E UI 검증 |

---

## 2. 디렉터리 구조

```text
PersonalDashboard/
├── docs/                        # 개발 문서 및 사내 인계 가이드
│   ├── architecture.md          # [현재 문서] 시스템 아키텍처
│   ├── contributing.md          # 개발 가이드 및 워크플로우
│   ├── theme-and-design-system.md # 디자인 시스템 및 컬러 토큰
│   ├── company-handoff.md       # 사내 실시스템 연동 가이드
│   ├── verification.md          # 회귀 및 품질 검증 기록
│   └── assets/                  # 문서용 스크린샷 자산
├── src/                         # 프런트엔드 애플리케이션 소스
│   ├── components/              # 화면 공통 컴포넌트
│   │   ├── GlobalSearch.tsx     # Ctrl+K 전역 검색 모달
│   │   └── ui.tsx               # 모달, 다이얼로그 래퍼 등 UI 공통 컴포넌트
│   ├── data/                    # 도메인 모델 및 샘플 데이터
│   │   ├── model.ts             # 핵심 도메인 타입 정의 (Task, Build, Firmware 등)
│   │   ├── search.ts            # 업무/펌웨어/전역 검색의 문자열 매칭 정책
│   │   └── demo.ts              # 가상 개발용 목업 데이터
│   ├── features/                # 도메인별 기능 모듈
│   │   ├── overview/            # 통합 대시보드 요약 화면
│   │   │   ├── Overview.tsx     # Overview 메인 (Bento 그리드, 하단 라인 정렬)
│   │   │   ├── FairyTaleSky.tsx # 시간대별 서정적 천체 일러스트 뷰
│   │   │   ├── celestial.ts    # 시간대와 천체 위치의 순수 계산
│   │   │   └── overview.css     # Bento 레이아웃 스타일
│   │   ├── tasks/               # Jira 스타일 워크플로우 업무 보드 (Open/Progress/Resolved/Closed)
│   │   │   ├── Tasks.tsx
│   │   │   ├── filter.ts        # 업무 필터링 및 정렬 로직
│   │   │   └── useBoardMotion.ts# 카드 진입 및 위치 이동 FLIP 애니메이션
│   │   ├── todos/               # 일일 체크리스트 및 과거 히스토리 타임라인
│   │   │   ├── Todos.tsx        # 편집기와 히스토리 화면 조합
│   │   │   ├── TodoEditor.tsx   # 계층 편집, 키보드 포커스, 드래그 순서 변경
│   │   │   ├── TodoHistory.tsx  # 히스토리 검색, 월 선택, 카드 모션
│   │   │   ├── OverviewTodoSection.tsx # 홈 미리보기와 빠른 추가
│   │   │   ├── useTodos.ts      # 상태, 편집 명령, 지연 저장 및 종료 flush
│   │   │   ├── todoModel.ts     # 날짜 및 계층 생성/완료/이동/삭제 순수 함수
│   │   │   ├── todoHistoryModel.ts # 일별 로그, 월 그룹, 기록 검색 순수 함수
│   │   │   ├── todoStorage.ts   # 저장 키와 기존 데이터 초기 로딩
│   │   │   ├── demoTodos.ts     # 기본 샘플 및 과거 샘플 데이터
│   │   │   ├── demoHistory.ts   # 과거 일자별 히스토리 데이터 및 대량 목업
│   │   │   ├── HistoryPeriodPicker.tsx # 연도/월 선택 그리드 바
│   │   │   └── HistoryNoteItems.tsx    # 메모지 기록 렌더링 및 키워드 하이라이트(renderHighlightedText)
│   │   ├── builds/              # 빌드 대기열 및 시뮬레이션
│   │   │   ├── Builds.tsx
│   │   │   └── validation.ts    # 빌드 제출 폼 검증
│   │   └── firmware/            # 펌웨어 아티팩트 검색 및 복사
│   │       ├── Firmware.tsx
│   │       └── filter.ts        # 펌웨어 필터/검색 로직
│   ├── App.tsx                  # 최상위 애플리케이션 진입점 및 전역 상태 소유
│   ├── main.tsx                 # React 루트 렌더러
│   ├── styles.css               # 기본 유틸리티 및 레이아웃 스타일
│   ├── theme.css                # Daylight / Midnight 컬러 토큰 및 테마 오버라이드
│   └── task-board.css           # 업무 보드 및 To-Do 특화 레이아웃 스타일
├── src-tauri/                   # Tauri Rust 네이티브 백엔드
│   ├── Cargo.toml               # Rust 의존성 매니페스트
│   ├── tauri.conf.json          # Tauri 창 설정 및 보안 권한 구성
│   └── src/
│       └── main.rs              # 윈도우 인스턴스 초기화 및 핸들러
├── tests/                       # 단위 및 브라우저 회귀 테스트
│   ├── celestial.test.ts        # 시간대별 천체 물리 계산 및 배경 매핑 단위 테스트
│   ├── domain.test.ts           # Vitest 도메인 및 검색 단위 테스트
│   └── ui/                      # Playwright E2E UI 인터랙션 테스트 (overview-layout, history-search 등)
└── scripts/                     # 개발 자동화 및 캡처 스크립트
```

---

## 3. 상태 관리 및 데이터 흐름

```mermaid
flowchart TD
    App["src/App.tsx (Root State)"]
    ThemeState["Theme State<br/>(Daylight / Midnight)"] -->|persist| LocalStorageTheme["localStorage('folio.theme')"]
    HiddenTasks["Hidden Tasks State"] -->|persist| LocalStorageHidden["localStorage('friday.hidden-task-ids')"]
    
    App --> Nav["Navigation (Active View)"]
    App --> OverviewView["Overview Feature"]
    App --> TasksView["My Tasks Feature"]
    App --> TodosView["To-Do Feature"]
    App --> BuildsView["Builds Feature"]
    App --> FirmwareView["Firmware Feature"]
    App --> SearchModal["GlobalSearch (Ctrl+K)"]
    
    App --> TodoState["useTodos<br/>state + commands + persistence"]
    TodoState --> TodosView
    TodoState --> OverviewView
    TodoState -->|persist| LocalStorageTodos["localStorage('friday.todos.v4')"]
```

### 3.1 상태 호이스팅 (State Hoisting) 원칙
- **전역 화면 상태 (`App.tsx`)**: 네비게이션 현재 탭, 전역 검색창 열림 여부, 워크스페이스 설정 다이얼로그, 시뮬레이션 빌드 대기열 상태, 로컬 숨김 처리된 태스크 ID 목록(`hiddenTaskIds`), 다크/라이트 테마(`theme`)를 소유합니다.
- **도메인 격리 상태**:
  - `Tasks.tsx`: 검색어 필터, 정렬 기준, 상세 패널 선택 이슈 ID 등은 태스크 화면 내부에서 관리됩니다.
  - `useTodos.ts`: App에서 한 번 호출하여 홈과 To-Do가 같은 목록과 편집 명령을 사용합니다. 화면 이동으로 저장 타이머가 해제되지 않습니다.
  - `TodoEditor.tsx`: 입력 초안, 선택 항목, 커서 복구와 드래그 상태를 관리합니다. 부모/자식 행은 동일한 재귀 렌더링을 사용합니다.
  - `TodoHistory.tsx`: 검색어, 선택 월, 카드 모션을 관리합니다. 일별 로그는 한 번 계산하여 월별 그룹과 검색에서 공유합니다.

### 3.2 로컬 영속성 및 Fallback 안전성
- 텍스트 편집은 350ms 지연 저장합니다. 계층 변경/추가/완료/삭제는 대기 중인 저장을 취소하고 최신 목록을 즉시 저장합니다. `beforeunload`와 훅 해제 시 미저장 값을 flush합니다.
- 대량 히스토리 미리보기(`?todoHistory=large`)에서는 저장하지 않습니다.
- 저장 실패는 세션 상태를 유지하고 알림으로 표시합니다. 테마/숨김 목록의 읽기 실패도 알림을 표시합니다. 할 일 초기 로딩은 기존 계약에 따라 읽기 실패 또는 배열이 아닌 데이터에 샘플을 사용합니다. 이 리팩터링에서 데이터 검증/복구 정책은 변경하지 않았습니다.

### 3.3 모듈 경계

- `todoModel`은 React, 스토리지, 샘플 데이터에 의존하지 않습니다. 자식 인덱스는 도메인 연산과 두 화면이 공유합니다.
- `todoHistoryModel`은 순수한 일별 기록을 입력받아 월별 그룹을 생성합니다. 화면에서 중복 집계하지 않습니다.
- `demoTodos`와 `todoStorage`는 도메인 계층 위에 있으며 순환 참조나 재수출용 호환 모듈을 두지 않습니다.
- `data/search.ts`는 공백 제거와 대소문자 무시 매칭만 담당합니다. 검색 필드, 필터, 정렬, 결과 제한은 각 호출자가 유지합니다. 히스토리 검색은 기존의 별도 결과 변환 규칙을 유지합니다.
- 테마 색상은 CSS 토큰이 소유하며, 사용되지 않던 별도의 TypeScript 토큰 복제본은 제거했습니다.

---

## 4. UI/UX 및 디자인 시스템 철학

### 4.1 "레이아웃으로 설명을 전달한다"
- **불필요한 세컨더리 라벨이나 부제(eyebrow), 영문 장식 문구를 지양합니다.**
- 사용자가 버튼 라벨이나 안내문을 읽지 않고도, 카드의 형태, 대비, 그리드 정렬, 여백(Spacing), 시각적 위계만으로 조작 방식을 직관적으로 이해할 수 있도록 설계되었습니다.

### 4.2 Anti-AI Aesthetic (AI 틱한 클리셰 배제)
- 생성형 AI가 대량 생성하는 전형적인 네온 보라빛 그라데이션, 번쩍이는 사이버 시안 글로우 효과를 완전히 배제했습니다.
- 다크 모드(Midnight)에서는 실제 하드웨어 엔지니어링 및 랩 작업실에 어울리는 **따뜻한 중성 차콜 캔버스(`var(--surface)`)** 위에 **톤다운된 앤틱 브라스/골드 (`#cca04b`)**를 핵심 악센트로 채택했습니다.
- 이월된 미완료 할 일은 차분한 테라코타 러스트(`--color-carried`) 배지로 구분하여 작업 우선순위를 명확히 합니다.

### 4.3 경량 인터랙션 & 0% 유휴 오버헤드
- 외부 거대 애니메이션 라이브러리(Framer Motion 등)를 배제하고 **순수 CSS Transition** 및 **Web Animations API**만을 활용합니다.
- 상시 실행되는 `requestAnimationFrame` 루프나 불필요한 백그라운드 폴링 타이머가 없으므로 유휴 상태(Idle) CPU 사용량은 0%를 유지합니다.
- OS의 `prefers-reduced-motion` 및 앱 내 설정의 "움직임 줄이기" 옵션을 최우선으로 존중합니다.

---

## 5. 네이티브 바운더리 및 연동 확장성

- 현재 UI 프로토타입 단계에서는 `src-tauri/src/main.rs`가 창 관리(생명주기, 크기, 타이틀바)만을 수행합니다.
- 실제 연동 시 데이터 로딩/저장 경계에서 Tauri IPC를 연결합니다. `filter.ts`, `todoModel.ts`, `todoHistoryModel.ts`는 API 공급자가 아닌 순수 도메인 연산이므로 네이티브 호출을 직접 넣지 않습니다.
- 상세한 사내 연동 단계와 주의사항은 [회사 환경 연동 가이드](company-handoff.md)를 참고하십시오.

## 6. Calendar 모듈

`features/calendar/Calendar.tsx`는 월간 격자와 선택일 목록, `EventEditor.tsx`는 기존 Radix Modal 기반 일정 편집을 담당한다. `calendarModel.ts`는 날짜/시간 검증과 공휴일 조회, `calendarStorage.ts`는 버전 검증·저장 실패·동시 변경 감지를 담당한다. 저장 시 Web Locks로 창 간 읽기/비교/쓰기를 직렬화한다. 충돌한 입력은 원본을 덮어쓰지 않고 새 일정으로 저장할 수 있다.

날짜 공통 함수는 `data/date.ts`로 이동하고 기존 To-Do import는 re-export로 유지한다. 공휴일 JSON은 빌드에 포함되며 런타임 통신은 없다. 자세한 범위와 저장 정책은 [Calendar](calendar.md)를 따른다.
