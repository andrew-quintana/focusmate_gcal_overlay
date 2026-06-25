# Phase 4 Execution Prompt — Content Script & Overlay UI

## Objective
Implement the content script that detects Focusmate sessions, renders the calendar overlay, and applies conflict highlighting. This is the user-facing layer that interacts with the Focusmate page.

## Context Documents
- @docs/initiatives/001_initial_implementation/scoping/PRD001.md
- @docs/initiatives/001_initial_implementation/scoping/RFC001.md
- @docs/initiatives/001_initial_implementation/scoping/TODO001.md
- @docs/initiatives/001_initial_implementation/scoping/context.md
- @docs/initiatives/001_initial_implementation/intermediate/phase_3_handoff.md

## Phase Scope
This phase implements the content script components:
- DOM detection for Focusmate sessions and date ranges
- Calendar overlay UI in Shadow DOM
- Conflict styling on Focusmate session elements
- MutationObserver for DOM changes
- Lifecycle management and error handling

## Key Requirements

### DOM Detection (`src/content/domDetector.ts`)
- Implement `FocusmateDOMDetector` class
- **Critical**: Focusmate DOM has no stable identifiers
- Use derived keys from time ranges: `${startMs}-${endMs}-${labelHash}`
- Implement multiple selector strategies:
  - Accessibility labels
  - Time text parsing
  - Derived keys from observable attributes
- Handle Focusmate route changes and SPA navigation
- Detect visible date range from Focusmate UI (day/week view)

### Overlay UI (`src/content/overlay.ts`)
- Implement `CalendarOverlay` class
- Create Shadow DOM container for style isolation
- Render events in agenda or mini-timeline format
- Display event time range, title, calendar indicator
- Collapse/expand toggle functionality
- Date range indicator (Today / This Week)
- Clickable links to open events in Google Calendar
- Persist across SPA route changes

### Conflict Styling (`src/content/conflictStyling.ts`)
- Implement `ConflictStyler` class
- Apply CSS class (e.g., `.fmcal-conflict`) to conflicting sessions
- Use configurable conflict color from settings
- Inject styles via Shadow DOM or document head
- Add tooltips or indicators showing conflicting events
- Reapply styles when Focusmate UI re-renders

### Content Script Main (`src/content/content.ts`)
- Initialize on Focusmate page load
- Set up MutationObserver on calendar grid container
- Debounce MutationObserver callbacks (200ms)
- Detect Focusmate route changes
- Request data from background service worker
- Coordinate overlay rendering and conflict styling
- Handle settings changes (re-render on settings update)
- Implement error handling and user feedback

## Implementation Tasks

Refer to @docs/initiatives/001_initial_implementation/scoping/TODO001.md Phase 4 section for detailed checklist.

## Validation Requirements

1. **Overlay Rendering**: Overlay appears on Focusmate page load
2. **Conflict Highlighting**: Conflicting sessions are visually highlighted
3. **MutationObserver**: Overlay and conflicts persist across DOM changes
4. **Route Changes**: Overlay persists across Focusmate SPA navigation
5. **DOM Selectors**: Multiple selector strategies work correctly
6. **Manual Testing**: Test with real Focusmate page in Chrome

## Testing Requirements

- Test overlay rendering on Focusmate page
- Test conflict highlighting
- Test MutationObserver behavior
- Test overlay persistence across route changes
- Test DOM selector strategies
- Manual testing in Chrome with real Focusmate page

## Documentation Requirements

After completing this phase, create:

1. **`intermediate/phase_4_decisions.md`**
   - Document DOM selector strategies used
   - Document session key derivation approach
   - Document overlay positioning and styling decisions
   - Document MutationObserver implementation details
   - Document any Focusmate DOM structure discoveries
   - Document any deviations from RFC

2. **`intermediate/phase_4_testing.md`**
   - Document overlay rendering test results
   - Document conflict highlighting test results
   - Document MutationObserver test results
   - Document route change test results
   - Document DOM selector strategy test results
   - Document manual testing results

3. **`intermediate/phase_4_handoff.md`**
   - Document DOM selector strategies used
   - Document any Focusmate DOM structure discoveries
   - Document overlay positioning and styling decisions
   - Document MutationObserver implementation details
   - Document any known limitations
   - Provide clear instructions for Phase 5

## Checklist Updates

As you complete tasks, update the checkboxes in:
- @docs/initiatives/001_initial_implementation/scoping/TODO001.md Phase 4 section

## Important Notes

- **No Stable DOM IDs**: Focusmate DOM has no stable identifiers. Always use derived keys.
- **Multiple Selector Strategies**: Implement fallbacks for robustness
- **Shadow DOM**: Use Shadow DOM for style isolation
- **Debouncing**: Debounce MutationObserver callbacks to 200ms
- **Route Changes**: Handle Focusmate SPA navigation gracefully
- **Error Handling**: Provide user feedback for errors

## Success Criteria

- [ ] Overlay renders correctly on Focusmate page
- [ ] Conflict highlighting works correctly
- [ ] MutationObserver handles DOM changes
- [ ] Overlay persists across route changes
- [ ] DOM selector strategies are robust
- [ ] Phase 4 handoff document is complete

