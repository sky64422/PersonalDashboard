# 개발자 가이드 및 워크플로우 (Contributing & Developer Guide)

Friday 프로젝트 개발에 참여하거나 기능을 추가/수정할 때 필요한 환경 설정, 실행 방법, 테스트 작성 규칙 및 코드 스타일 가이드입니다.

---

## 1. 개발 환경 요구사항

- **운영체제**: Windows 11 (64-bit 권장)
- **Node.js**: v24 LTS 이상
- **패키지 매니저**: `npm` (프로젝트 내 `package-lock.json` 준수)
- **Rust**: stable MSVC 툴체인 (`rustup default stable-x86_64-pc-windows-msvc`)
- **C++ 빌드 툴**: Visual Studio Build Tools (C++ 데스크톱 개발 워크로드)
- **WebView2**: Windows 11에 내장된 Microsoft Edge WebView2 Runtime

---

## 2. 초기 셋업 및 실행 명령어

### 2.1 의존성 설치
```powershell
npm ci
```

### 2.2 브라우저 개발 서버 (빠른 프런트엔드 UI 작업)
브라우저에서 UI 및 상태 인터랙션을 즉시 확인하려면 개발 서버를 실행합니다:
```powershell
npm run dev
# 기본 주소: http://127.0.0.1:1420
```

> [!NOTE]
> **대량 히스토리 스트레스 테스트 모드**
> 과거 7개년, 82개월간 약 12,400개의 대량 히스토리 기록을 렌더링하고 탐색하려면 브라우저에서 다음 주소로 접속합니다:
> `http://127.0.0.1:1420/?todoHistory=large`
> 이 모드에서 수정한 내용은 로컬 스토리지를 덮어쓰지 않는 안전한 샌드박스로 동작합니다.

### 2.3 데스크톱 앱 실행 (Tauri 윈도우 환경)
네이티브 윈도우 프레임, 단축키 및 창 제어를 함께 테스트하려면 Tauri dev를 실행합니다:
```powershell
npm run tauri -- dev
```
*(주의: `tauri dev`가 자체적으로 Vite 개발 서버를 구동하므로, 포트 충돌을 피하기 위해 `npm run dev`와 동시에 실행하지 마세요.)*

---

## 3. 테스트 및 빌드 파이프라인

모든 변경 사항은 커밋하기 전에 반드시 다음 검증 단계를 통과해야 합니다.

### 3.1 단위 테스트 (Vitest)
도메인 로직, 필터링, 할 일 생성/이월/정렬 알고리즘을 검증합니다:
```powershell
npm test
```
- 대상 파일: `tests/domain.test.ts`
- 실행 시간: 약 300ms 내외

### 3.2 E2E UI 테스트 (Playwright)
실제 브라우저 환경에서 키보드 탐색, 모달 다이얼로그, 테마 전환, 레이아웃 반응성을 검증합니다:
```powershell
npm run test:ui
```
- 대상 디렉터리: `tests/ui/*.spec.ts`
- 총 27개 이상의 시나리오 검증

### 3.3 프런트엔드 프로덕션 빌드
TypeScript 컴파일(`tsc -b`) 및 Vite 프로덕션 에셋 번들링을 검사합니다:
```powershell
npm run build
```

### 3.4 네이티브 릴리즈 빌드
Rust 컴파일 및 Windows 실행 파일(`.exe`)을 생성합니다:
```powershell
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
npm run tauri -- build --no-bundle
```
- 생성 파일: `src-tauri/target/release/personal-dashboard.exe`

---

## 4. 테스트 작성 규칙 및 주의사항

Playwright 테스트 작성 시 다음 규칙을 엄격히 준수해야 합니다:

1. **Strict Mode Locator 준수**:
   - `page.getByRole('button', { name: '...' })` 사용 시 화면 내에 동일한 Accessible Name을 가진 요소가 둘 이상 존재하면 Playwright Strict Mode 위반으로 테스트가 실패합니다.
   - 툴팁이나 헤더의 사용자 프로필 아바타 등 클릭 목적이 아닌 장식/식별 요소는 `<button>` 대신 `<span role="img">` 또는 고유한 `aria-label`을 지정하세요.
2. **텍스트 부분 일치 주의**:
   - `getByRole('button', { name: '이전 기록' })`은 `'이전 기록 카드 스크롤'`과 같은 텍스트에도 부분 매칭될 수 있으므로, 명확하고 고유한 라벨(`exact: true` 옵션 또는 고유한 네이밍)을 사용하십시오.
3. **키보드 접근성 테스트**:
   - 마우스 클릭뿐만 아니라 `Enter`, `Tab`, `Escape`, 방향키 이동이 올바르게 동작하는지 테스트 케이스를 포함해야 합니다.

---

## 5. 코드 스타일 및 설계 규칙

1. **레이아웃 중심 미니멀리즘**:
   - UI에 의미가 중복되는 텍스트 라벨("할 일을 입력하세요", "여기를 클릭하면 삭제됩니다" 등)을 남발하지 마십시오.
   - 레이아웃 구조, 플레이스홀더, 단축키 힌트 칩(`<kbd>Enter</kbd>`)만으로 충분히 인지되도록 설계합니다.
2. **AI 클리셰 스타일 금지**:
   - 다크 모드에 일렉트릭 퍼플/네온 시안 그라데이션을 임의로 추가하지 마십시오.
   - `src/theme.css`에 정의된 앤틱 골드(`--brand-f-accent: #cca04b`) 및 시맨틱 변수(`--canvas`, `--surface`, `--color-carried`)를 우선 사용하십시오.
3. **Zero Idle Overhead (성능 최적화)**:
   - 불필요한 백그라운드 `setInterval`, `requestAnimationFrame` 무한 루프 생성을 금지합니다.
   - 애니메이션은 CSS 토큰 또는 단발성 Web Animations API를 사용하며, 인터랙션이 끝나면 즉시 가비지 컬렉션되도록 작성합니다.

---

## 6. 커밋 메시지 컨벤션 (Conventional Commits)

커밋 메시지는 다음 구조를 따릅니다:

```text
<type>(<scope>): <short description>

- <detailed changes bullet 1>
- <detailed changes bullet 2>
```

- **타입 예시**:
  - `feat`: 신규 기능 추가 또는 주요 UI 개편
  - `fix`: 버그 및 회귀 수정
  - `style`: 디자인 토큰, 색상, 여백 조정
  - `refactor`: 동작 변경 없는 코드 구조 개선
  - `test`: 테스트 케이스 추가 및 보완
  - `docs`: 문서 생성 및 업데이트
