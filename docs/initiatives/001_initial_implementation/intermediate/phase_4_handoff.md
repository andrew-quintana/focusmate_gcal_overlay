# Phase 4 Handoff

## Overview

Phase 4 implements the content script layer that detects Focusmate sessions, renders the calendar overlay, and applies conflict highlighting. This is the user-facing layer that interacts with the Focusmate page.

## Implementation Summary

### Modules Implemented

1. **`src/content/domDetector.ts`** - DOM detection with multiple selector strategies
   - `FocusmateDOMDetector` class
   - Date range detection with fallbacks
   - Session extraction from DOM
   - Session element finding
   - Session key generation

2. **`src/content/overlay.ts`** - Calendar overlay UI
   - `CalendarOverlay` class
   - Shadow DOM isolation
   - Event rendering
   - Collapse/expand functionality
   - Date range indicator

3. **`src/content/conflictStyling.ts`** - Conflict styling utilities
   - `ConflictStyler` class
   - CSS injection into document head
   - Conflict class application
   - Tooltip implementation

4. **`src/content/content.ts`** - Main content script
   - `ContentScriptController` class
   - Initialization and lifecycle management
   - MutationObserver setup and debouncing
   - Settings integration
   - Error handling

## DOM Selector Strategies

### Multiple Fallback Strategies

Since Focusmate DOM has no stable identifiers, we implemented multiple selector strategies:

1. **Accessibility Labels**: Look for `aria-label` attributes containing time patterns
2. **Time Text Parsing**: Search for time patterns in text content (e.g., "10:00 AM - 10:25 AM")
3. **Data Attributes**: Check for `data-session-time`, `data-start-time`, `data-session-id`
4. **Derived Keys**: Generate session keys from time ranges and optional labels

### Date Range Detection Strategies

1. **Date Text Parsing**: Look for "Today", "Week of...", or date patterns
2. **Calendar Grid Detection**: Check for calendar grid elements with date attributes
3. **Week View Detection**: Detect week view indicators and calculate Monday-Sunday range
4. **Fallback**: Default to current day (today 00:00 to tomorrow 00:00)

### Session Key Derivation

- Uses `generateSessionKey()` from `utils/sessionNormalization.ts`
- Format: `${startMs}-${endMs}-${labelHash}`
- Consistent between conflict computation and styling application

## Focusmate DOM Structure Discoveries

### Key Findings

1. **No Stable IDs**: Focusmate is a React-based SPA with hashed class names
2. **Dynamic Rendering**: DOM structure may change on route changes
3. **Multiple Views**: Different views (day/week/upcoming) may have different DOM structures
4. **Time Patterns**: Time information appears in text content and accessibility labels

### Selector Implementation

Selectors are implemented with multiple fallbacks to handle:
- Different Focusmate views
- DOM structure changes
- Missing elements
- Various time formats

## Overlay Positioning and Styling

### Shadow DOM Implementation

- Uses Shadow DOM with `mode: 'closed'` for complete style isolation
- All styles injected into shadow root
- Prevents CSS conflicts with Focusmate page

### Positioning

- Fixed position: `top: 20px, right: 20px`
- Width: `320px`
- Max height: `600px`
- Z-index: `10000`

### Visual Design

- Modern, clean design with subtle shadows
- Collapsible header with toggle button
- Scrollable event list
- Hover effects on events
- Clickable events that open Google Calendar links
- All-day event badges

### Persistence

- Overlay persists across SPA route changes
- Recreated if DOM is removed
- MutationObserver detects and handles DOM changes

## MutationObserver Implementation

### Configuration

```typescript
{
  childList: true,    // Watch for added/removed children
  subtree: true,      // Watch entire subtree
  attributes: false,  // Don't watch attribute changes (performance)
}
```

### Target Selection

Multiple fallback selectors:
1. `[data-calendar-grid]`
2. `.calendar-grid`
3. `[role="grid"]`
4. `main`
5. `body` (fallback)

### Debouncing

- 200ms debounce on MutationObserver callbacks
- Prevents performance degradation from frequent DOM changes
- Uses `window.setTimeout` for debouncing

## Conflict Styling Implementation

### CSS Injection

- Styles injected into document `<head>` (not Shadow DOM)
- Allows styling of Focusmate session elements
- Style element has ID `fmcal-conflict-styles` for easy removal

### Visual Indicators

1. **Background Color**: Semi-transparent conflict color (`${color}20`)
2. **Border**: 2px solid border in conflict color
3. **Box Shadow**: Subtle shadow with conflict color tint
4. **Warning Icon**: Unicode ⚠ character in top-right corner
5. **Tooltip**: Hover tooltip showing conflict count

### Tooltip Implementation

- Uses CSS `::after` pseudo-element with `attr(data-fmcal-tooltip)`
- Positioned above element on hover
- Shows conflict count: "Conflicts with N calendar events"

## Settings Integration

### Real-time Updates

- `chrome.storage.onChanged` listener for settings updates
- Overlay toggles on/off based on `overlayEnabled` setting
- Conflict color updates immediately when changed
- Debug logging updates detector and styler

### Settings Affecting Behavior

1. **overlayEnabled**: Controls overlay visibility
2. **conflictColor**: Updates conflict styling color
3. **calendarIds**: Triggers data re-fetch
4. **debugLogging**: Enables/disables verbose logging

## Error Handling

### Graceful Degradation

- If date range cannot be detected, fallback to "today"
- If overlay container cannot be created, log error and continue
- If data fetch fails, show existing data or empty state
- If conflict styling fails, log error but don't break overlay

### User Feedback

- Error messages logged when debug logging enabled
- Overlay shows "No events" if data fetch fails
- Conflict styling silently fails if elements not found

## Known Limitations

### DOM Selector Fragility

- Focusmate DOM structure may change, breaking selectors
- Multiple fallback strategies mitigate but don't eliminate risk
- May require selector updates if Focusmate UI changes significantly

### Session Detection Accuracy

- DOM scraping may miss sessions if structure changes
- Time parsing may fail with non-standard formats
- Prefer Google Calendar as source of truth when sync enabled

### Route Change Detection

- Relies on MutationObserver detecting DOM changes
- May not immediately detect all route changes
- 200ms debounce may cause slight delay in updates

## Integration Points

### Background Service Worker

- Sends `FETCH_DATA_FOR_RANGE` messages
- Receives `RangeDataResponse` with events, sessions, and conflicts
- Handles errors from background gracefully

### Utility Functions

- Uses `generateSessionKey()` from `utils/sessionNormalization.ts`
- Consistent key generation between detection and styling

### Type Definitions

- Uses types from `types/events.ts`, `types/messages.ts`, `types/storage.ts`
- All message types properly typed

## Instructions for Phase 5

### Prerequisites

1. ✅ Content script implemented
2. ✅ DOM detection working
3. ✅ Overlay rendering implemented
4. ✅ Conflict styling implemented
5. ✅ MutationObserver set up
6. ✅ Settings integration working

### Next Steps

1. **Implement Options Page** (`src/options/`):
   - `settingsManager.ts` - Settings management
   - `options.ts` - Options UI logic
   - `options.html` - Options page HTML
   - `styles/options.css` - Options page styles

2. **Key Integration Points**:
   - Load settings from `chrome.storage.local`
   - Save settings to `chrome.storage.local`
   - Fetch available calendars from background
   - Update settings and trigger content script updates

3. **UI Components**:
   - Calendar selection (multi-select)
   - Color picker for conflict color
   - Toggle switches for overlay and debug logging
   - API key input for Focusmate (optional)

4. **Settings Validation**:
   - Validate color format
   - Validate API key format (if provided)
   - Provide user feedback on save

### Important Notes

- **Settings Schema**: Use `ExtensionSettings` interface from `types/storage.ts`
- **Default Values**: Use `DEFAULT_SETTINGS` constant
- **Storage Keys**: Use `STORAGE_KEYS` constant
- **Real-time Updates**: Content script listens to storage changes automatically
- **Calendar Selection**: Support multiple calendars from multiple accounts
- **Error Handling**: Provide user-friendly error messages

## Validation Checklist

Before proceeding to Phase 5, verify:
- [x] All modules compile successfully
- [x] No TypeScript errors
- [x] No linter errors
- [x] Build output generated correctly
- [x] DOM detection strategies implemented
- [x] Overlay rendering implemented
- [x] Conflict styling implemented
- [x] MutationObserver set up
- [x] Settings integration working
- [x] Error handling implemented
- [x] Phase 4 handoff document complete
- [x] Phase 4 decisions document complete
- [x] Phase 4 testing summary complete

## Questions or Issues

If you encounter any issues during Phase 5:
1. Check this handoff document first
2. Review `phase_4_decisions.md` for implementation details
3. Review `phase_4_testing.md` for test coverage
4. Check content script source code for usage examples
5. Review message protocol in `types/messages.ts`
6. Review settings schema in `types/storage.ts`

## Manual Testing Required

**Important**: Manual testing with a real Focusmate page is required to validate:
- DOM selector strategies work with actual Focusmate DOM
- Overlay renders correctly
- Conflict highlighting works
- Route changes are handled correctly

Manual testing should be performed before considering Phase 4 complete for production use.

