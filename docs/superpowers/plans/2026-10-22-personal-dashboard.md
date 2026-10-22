# Personal Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution or superpowers:subagent-driven-development if the user selects delegation. Track the steps below as they are completed.

**Goal:** Deliver a polished Windows 11 desktop dashboard with working sample-data interactions and documented company integration points.

**Architecture:** A single Tauri window hosts a React application. Feature modules consume shared typed sample records; Rust owns desktop lifecycle and future company integration. No company connection is simulated as real.

**Tech Stack:** Tauri 2, Rust, React, TypeScript, Vite, Tailwind CSS, selective shadcn/ui primitives. Use Lucide icons for consistent navigation glyphs, Vitest for domain behavior and Playwright for browser interaction checks; disclose these additions before installation. Pin resolved versions in lockfiles.

**Spec:** [Approved design](../specs/2026-10-22-personal-dashboard-design.md)

## Global constraints

- Windows 11, one WebView2 window, standard native title bar.
- Four views: Overview, My Tasks, Builds, Firmware. Korean body copy, concise English navigation.
- Light cards, charcoal type, lavender/lime accents; no remote fonts or continuous decorative animation.
- Motion tokens: 120 ms controls, 200 ms panels, reduced-motion support.
- Tasks must match current assignee and status != Closed, not a broader Done-category exclusion.
- Demo queue submission never calls a build service. Sample firmware paths are fictional.
- No credentials, guessed company API endpoints, database or separate web backend.
- Include WebView2 children in native process measurements; report unmeasured performance honestly.
- Read local ENGINEERING.md before implementation and RELEASE.md before commits.

## Review focus

1. A Done-but-not-Closed issue remains visible; another assignee's issue stays excluded.
2. Whitespace-only queries and filters with no matches must produce coherent results and allow reset.
3. Double submission must not create duplicate demo builds; cancelling confirmation creates none.
4. Detail panels must restore focus, close with Escape and work with reduced motion.
5. Clipboard denial must report failure, and smaller/scaled windows must not hide core actions.

## File map

- `src/App.tsx`: navigation and feature composition.
- `src/components/`: sidebar, search dialog, badges, reusable accessible UI primitives.
- `src/styles.css`: design tokens, layout, typography and motion.
- `src/data/model.ts`, `src/data/demo.ts`: domain types and shared fictional fixtures.
- `src/features/tasks/`: task filtering, list and detail panel.
- `src/features/builds/`: build validation, form, confirmation and history.
- `src/features/firmware/`: artifact search, result presentation and path copy.
- `src/features/overview/`: summaries and entry points consuming the same data.
- `src-tauri/`: Rust host, Tauri configuration and minimal capabilities.
- `tests/`: domain tests and browser interaction checks.
- `README.md`, `docs/company-handoff.md`, `docs/verification.md`: operation, integration and observed verification evidence.

## Task 1: Desktop shell and visual foundation

Produces `ViewId = 'overview' | 'tasks' | 'builds' | 'firmware'`, shared navigation, tokens and runnable desktop shell.

- [ ] Check repository state, installed tools, registry package identities and current official setup documentation. Disclose required dependencies before installing.
- [ ] Create package/TypeScript/Vite/Tailwind configuration, app entry, Tauri Cargo manifest, host entry and single-window configuration. Add `.gitignore` for node_modules, dist, target, local logs, screenshots and credentials.
- [ ] Implement sidebar, header, reusable card/button primitives and selected navigation state. Preserve standard Windows window controls.
- [ ] Implement responsive content layout and reduced-motion CSS. Use the approved color, spacing and radius tokens.
- [ ] Run `npm run build` and `cargo check --manifest-path src-tauri/Cargo.toml`; inspect the shell in browser and native window.
- [ ] Commit the executable shell once checks pass.

## Task 2: Shared records and assigned-task workflow

Produces `Task`, `Build`, `FirmwareArtifact`, `DEMO_USER_ID`, shared fixtures and `filterTasks(tasks, { assigneeId, query, status, sort })` returning `Task[]`. Tasks include id, key, title, project, assigneeId, status, priority, updatedAt and description. Build records include id, target, branch, profile, status and demo flag. Firmware records include id, filename, model, version, branch, buildId and path.

- [ ] Write failing Vitest cases for current assignee, Closed exclusion, Done inclusion, case-insensitive search, whitespace query, combined filters and stable ordering.
- [ ] Run `npm test -- --run`; confirm failures correspond to missing behavior.
- [ ] Implement domain types, fictional fixtures and pure filtering. Centralize repeated status labels and user-facing copy.
- [ ] Implement My Tasks list, filters, clear action and accessible detail panel. Preserve filters during navigation.
- [ ] Verify domain tests pass. Add browser assertions that Escape closes details and returns focus, and that no-match filtering offers reset.
- [ ] Commit task workflow after checks pass.

## Task 3: Build form and firmware lookup

Produces `validateBuildRequest({ target, branch, profile })`, demo-only submission, `filterFirmware(records, { query, model })`, and visible copy success/failure feedback.

- [ ] Write failing tests: blank required values invalid; valid request accepted; combined artifact filters and mixed-case filenames work.
- [ ] Implement controlled build form, confirmation summary, cancel path and demo queue insertion. Generate one id per confirmed request and prevent repeated submission of the same confirmation.
- [ ] Implement build history using shared records. Do not add simulated success timers or real network submission.
- [ ] Implement Firmware search/results and clipboard copying with explicit error feedback; do not expose fictitious download/open actions.
- [ ] Browser tests: cancelling creates no record, confirming creates one demo record, repeated confirmation cannot duplicate, copy success and mocked denial both display correctly.
- [ ] Run domain and browser checks, then commit both feature flows.

## Task 4: Overview, global search and visual refinement

Consumes shared records, feature filters and view navigation. Produces coherent summary counts, cross-feature search and final visual composition.

- [ ] Implement Overview with a large task area, restrained gradient focus card, recent builds and Firmware quick search.
- [ ] Compute all counts from records; filtering definitions remain shared with feature views.
- [ ] Implement global search across visible assigned tasks, builds and firmware. Result activation opens the relevant item and preserves its context.
- [ ] Verify search with keyboard, no-result search, and Overview firmware query transfer in browser tests.
- [ ] Inspect screenshots at 1440 × 960 and smaller desktop sizes; check wrapping, contrast, spacing, hover/focus and reduced-motion behavior. Refine against supplied references.
- [ ] Run `npm run build` and all tests; commit the completed UI composition.

## Task 5: Native verification, handoff and publication

- [ ] Run frontend tests/build, Rust format check and desktop production build. Record exact commands and outcomes in `docs/verification.md`.
- [ ] Launch the native app and check first opening, all navigation, resize, scroll, keyboard focus and minimize/restore. Distinguish browser checks from native checks.
- [ ] Measure idle and interactive CPU/memory for host plus associated WebView2 processes. Record hardware, refresh rate and build mode. Profile interaction frame pacing where tooling permits; mark high-refresh behavior unverified if suitable hardware is unavailable.
- [ ] Write README setup/run/build commands and company handoff: replace sample operations with Rust commands, map Jira identity/status, supply real build options and firmware source, avoid secrets in frontend and Git.
- [ ] Review diff for dead controls, erroneous live-service claims, accidental secrets/generated artifacts and unrequested scope. Correct issues and repeat affected checks.
- [ ] Commit documentation and any verified refinements. Push the implementation commits to the user's `origin/main` and verify remote HEAD matches local HEAD.

## Execution handoff

Execution approved by the user and performed inline. Tasks 1–4 were implemented and verified together as one initial foundation, rather than committing incomplete intermediate shells. Task 5 passed build, domain/UI tests, native navigation, resize, minimize/restore and idle resource sampling. Independent review found two keyboard issues; both were fixed with regression assertions. Interactive CPU/frame pacing and other DPI scales remain unmeasured. See `docs/verification.md`. Publication follows final native rebuild.
