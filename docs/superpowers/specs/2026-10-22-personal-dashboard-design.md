# Personal Dashboard — Windows UI foundation

Status: design approved by the user. Product implementation has not started.

## Outcome and scope

Build an attractive, responsive Windows 11 personal work dashboard. This milestone delivers a usable desktop UI with explicitly labeled sample data; actual company integrations will be implemented at work. The user prioritizes visual quality, restrained smooth animation, immediate feedback, high refresh rate support, and low idle CPU/memory use.

The workspace is empty. There is no existing product code, package manifest, or product-specific documentation to reuse. Global rules are C:/dev/Rules/ENGINEERING.md and RELEASE.md.

## Agreed stack and trade-offs

- Tauri 2 with a single WebView2 window and Rust host.
- React, TypeScript, and Vite for the UI and development build.
- Tailwind CSS and named CSS design tokens for visual consistency.
- Selective shadcn/ui primitives for keyboard-accessible dialogs, menus, and tabs. Install only primitives required by implemented interactions.
- CSS transitions for initial motion. No animation framework, chart framework, global state library, database, or separate HTTP server is required for this milestone.
- Rust is the eventual boundary for company API access and filesystem operations. Actual integrations and credential handling are outside this UI milestone.

This preserves the approved web-style design freedom and provides desktop integration. It does not guarantee a fixed memory footprint: WebView2 processes must be included in measurements. Browser-only and separate Python backend approaches remain unnecessary for the agreed desktop scope.

## Visual direction

Use the stable sidebar and aligned card layouts from reference images 2–4, with restrained lavender and pale lime accents from image 1. Do not reproduce their medical or financial content.

- Light neutral canvas, near-white cards, charcoal text, thin low-contrast borders, subtle shadows.
- Initial token targets: canvas #F5F5F7, surface #FFFFFF, text #24242A, muted text #62626D, lavender #E5DBFF, pale lime #E5F1CE. Validate contrast for actual text and states.
- Sidebar approximately 216 CSS px; main content with 24–32 px padding and 16–24 px gaps. Cards use approximately 20 px radii; controls use smaller radii.
- Larger typography for headings and useful summaries, readable 14–16 px body copy. Use local Windows fonts with Korean fallback; no remote font dependency.
- One restrained gradient highlight on Overview. No full-window blur, animated background, permanent shimmer, or continuous decorative animation.
- Korean body copy with concise English navigation names: Overview, My Tasks, Builds, Firmware. This language choice is an initial design assumption.
- Start with a standard Windows title bar for reliable dragging, resizing, snapping, and window controls. Design the content inside it.
- Desktop-first at roughly 1440 × 960, adapting to smaller windows with collapsed navigation and stacked columns. Verify Windows display scaling and avoid page-wide horizontal overflow.

## Screens and interactions

### Overview

Header with date, short greeting, global search, and a visible sample-data badge. Compact summaries reflect the same sample records used by feature pages. Main area prioritizes assigned work; secondary column contains a focused-work highlight and recent build. Firmware quick search links into the Firmware view with the query preserved.

### My Tasks

Only tasks assigned to the demo current user whose status is not Closed appear in the working list. Preserve the user's exact Closed condition: do not silently replace it with Jira's broader Done category. Include fixtures with another assignee and Closed status to validate exclusion.

Support text search, status filtering, ordering, clear-filter action, and an empty-result state. Selecting a task opens an accessible detail panel. Sample keys and descriptions must be fictional. Actual Jira URLs, identity mapping, authentication and workflow statuses are configured later at work.

### Builds

Show recent sample builds and a new-build form for target, branch and build profile. Validate required fields, show a confirmation summary, and allow explicit creation of a demo queue entry. Label the action and created record as simulation; never imply a company build was submitted. No automatic retry or fabricated live progress.

### Firmware

Search sample artifacts by model, version, branch and filename; offer a small set of useful filters. Results show filename, version, build association and an explicitly fictional path. Path copying must actually use the clipboard and report failures. No pretend filesystem opening or download of nonexistent artifacts.

### Shared behavior

Global search finds sample tasks, builds and firmware and navigates to the relevant item. Keyboard access, visible focus, Escape dismissal and focus restoration are required. Navigation selection and active filters remain coherent when moving between pages. No decorative controls without an implemented action.

## Code boundaries and data flow

- App shell owns navigation, layout and shared search presentation.
- Feature modules own task, build and firmware UI respectively.
- Shared UI contains only components actually reused or required accessibility primitives.
- Sample data and TypeScript domain models live outside view components. Overview and feature screens consume the same records.
- Keep feature data operations outside JSX so they can later be replaced by Tauri invocations. Do not build an unused generic provider framework or guess company endpoints.
- The Tauri host initially manages app lifecycle and only native capabilities needed by working UI. Add actual API and filesystem commands in the company integration milestone.
- React state is sufficient for filters, selection, dialogs and demo build submissions. Demo records reset on restart; document this behavior.
- Errors are shown explicitly, separately from empty results. Loading UI must not imply that an unconfigured company connection exists.

## Motion and performance

- Initial timing tokens: immediate press feedback, 120 ms hover/focus transitions and 200 ms panel/view transitions, with restrained easing.
- Animate transform and opacity where appropriate; avoid layout animation on large tables and large blurred layers.
- Respect reduced-motion preferences. Hidden or minimized windows must not run decorative loops or simulated polling.
- Avoid whole-app rerenders for local interaction. Start with a bounded sample list and pagination; add virtualization only if measured list sizes require it.
- Baseline target: stable interaction on a 60 Hz display. On available 120/144 Hz hardware, evaluate frame pacing against that refresh interval rather than imposing a 60 FPS cap.
- No guaranteed CPU percentage or RAM limit before measurement. Report build mode, hardware, display refresh, sample size and measurement scope with results. Include the Rust host and associated WebView2 processes.

## Verification and handoff

1. Type-check and production frontend build; Rust formatting/check and desktop build where installed tooling permits.
2. Meaningful tests for assigned/non-Closed filtering, combined search/filter behavior and build form validation/demo submission.
3. Browser interaction checks for navigation, search, detail panel keyboard behavior, empty results, clipboard outcome and responsive layout.
4. Inspect rendered screenshots against the references at desktop and smaller sizes, including Windows scaling where possible.
5. Run the actual Tauri window: verify first opening, navigation, resize, scroll, focus and minimize/restore. Browser checks alone do not establish native success.
6. Measure release-mode idle and interactive resource behavior and frame pacing when tooling permits. Explicitly state unmeasured cases; do not infer native performance from a successful build.
7. Supply README run/build commands and a company handoff document describing sample data replacement points, exact Jira filtering semantics, future build submission behavior and firmware integration boundaries. Include no company secrets or guessed endpoints.

## Deferred work

Company API calls, credentials, real file scanning, automatic refresh, persistent build history, database, updater, signed installer distribution, dark theme and broad widget customization are outside this first UI foundation. Add them when their actual requirements are known.
