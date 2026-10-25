# Overview and navigation refinement

## Current design - 2026-10-25

- The top row combines a standalone scenic Hero (60%) with a stacked Builds/Firmware utility column (40%). The Hero and utility stack share top and bottom edges. Keep the clear convex glass perimeter and five local-time scenes.
- The second row places Jira and To-Do side by side at 50/50, with aligned tops and bounded internal scrolling. Preserve solid panel surfaces. Builds shows two recent entries and links to the complete list.
- On narrow screens, stack the Hero, utility area, Jira and To-Do; below 600px the utility cards also stack. Preserve task details, build details, firmware search and todo parent/child interactions.
- Validate desktop column ratios, utility stack alignment, equal work columns, narrow overflow and long checklist accessibility. Inspect both themes and production WebView2 after the standard unit/UI/build checks.

The earlier layout below is historical and is superseded by the current design.

- Preserve the approved paper texture, neutral Daylight background, current data and all navigation actions.
- Selected navigation uses a solid, high-contrast surface with a bold label. The workspace settings shortcut becomes a small, unboxed row separated from navigation.
- Use a compact four-part summary strip, a balanced two-column work area (My tasks and To-Do), then a matching two-column utility row (Recent builds and Firmware).
- Move the existing priority focus into My tasks as a compact actionable feature. Keep task filters, details, quick To-Do entry, completion, build details and firmware search.
- Bound the work panels' height and let the To-Do list scroll independently so accumulated tasks cannot push builds far below the screen. Stack panels on narrow screens and retain keyboard access to every item.

## Implementation and validation

1. Add layout checks for aligned work/utility rows, long To-Do lists, narrow windows and the selected navigation state; confirm the current layout fails.
2. Update Overview markup and scoped styles; simplify the workspace shortcut and emphasize the active tab. Use existing components and tokens without new dependencies.
3. Run UI/domain tests, frontend build, Rust format and native build. Inspect both themes at 1440, 1280 and 900px, plus the native WebView2 app. Verify navigation, task details, To-Do completion and firmware search.

The existing independent left/right stacks caused the imbalance. Shared grid rows preserve alignment without hiding data or stretching small cards into empty columns.
