# Phase 4 Decisions

## Overview

Phase 4 implements the content script layer that detects Focusmate sessions, renders the calendar overlay, and applies conflict highlighting. This document captures key implementation decisions made during this phase.

## DOM Selector Strategies

### Multiple Fallback Strategies

Since Focusmate DOM has no stable identifiers, we implemented multiple selector strategies with fallbacks:

1. **Accessibility Labels**: Look for `aria-label` attributes containing time patterns
2. **Time Text Parsing**: Search for time patterns in text content (e.g., "10:00 AM - 10:25 AM")
3. **Data Attributes**: Check for `data-session-time`, `data-start-time`, `data-session-id` attributes
4. **Derived Keys**: Generate session keys from time ranges and optional labels

### Session Key Derivation

Session keys are derived using the `generateSessionKey()` function from `utils/sessionNormalization.ts`:
- Format: `${startMs}-${endMs}-${labelHash}`
- Label hash uses djb2 algorithm for consistent hashing
- Keys are consistent between conflict computation and styling application

### Date Range Detection

Multiple strategies for detecting visible date range:

1. **Date Text Parsing**: Look for "Today", "Week of...", or date patterns in UI
2. **Calendar Grid Detection**: Check for calendar grid elements with date attributes
3. **Week View Detection**: Detect week view indicators and calculate Monday-Sunday range
4. **Fallback**: Default to current day (today 00:00 to tomorrow 00:00)

## Overlay Positioning and Styling

### Shadow DOM Isolation

- Uses Shadow DOM with `mode: 'closed'` for complete style isolation
- Prevents CSS conflicts with Focusmate page
- All styles injected into shadow root

### Positioning

- Fixed position: `top: 20px, right: 20px`
- Width: `320px`
- Max height: `600px`
- Z-index: `10000` to ensure visibility above Focusmate content

### Visual Design

- Modern, clean design with subtle shadows
- Collapsible header with toggle button
- Scrollable event list
- Hover effects on events
- Clickable events that open Google Calendar links
- All-day event badges

### Responsive Behavior

- Overlay persists across SPA route changes
- Recreated if DOM is removed
- MutationObserver detects and handles DOM changes

## MutationObserver Implementation

### Target Selection

Multiple fallback selectors for finding the calendar grid container:
1. `[data-calendar-grid]`
2. `.calendar-grid`
3. `[role="grid"]`
4. `main`
5. `body` (fallback)

### Debouncing

- 200ms debounce on MutationObserver callbacks
- Prevents performance degradation from frequent DOM changes
- Uses `window.setTimeout` for debouncing

### Observation Configuration

```typescript
{
  childList: true,    // Watch for added/removed children
  subtree: true,      // Watch entire subtree
  attributes: false,  // Don't watch attribute changes (performance)
}
```

## Conflict Styling Approach

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

## Session Element Matching

### Matching Strategy

1. Extract sessions from DOM using multiple selector strategies
2. Generate session keys for each detected session
3. Match session keys from conflict map to DOM elements
4. Apply conflict styling to matched elements

### Key Matching

- Uses `generateSessionKey()` for consistent key generation
- Matches by time range and optional label hash
- Handles cases where session elements are not immediately found

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

## Performance Considerations

### Debouncing

- MutationObserver callbacks debounced to 200ms
- Prevents excessive API calls and DOM queries
- Balances responsiveness with performance

### Caching

- Relies on background service worker caching (60-second TTL)
- Reduces API calls from frequent DOM mutations
- Content script doesn't implement additional caching

### DOM Queries

- Uses efficient selectors (specific classes, attributes)
- Limits tree walking to necessary elements
- Processes elements in batches to avoid blocking

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

## Deviations from RFC

### None

All implementation follows the RFC001 design. No significant deviations were made.

## Future Enhancements

### Potential Improvements

1. **Better Route Detection**: Use `pushState`/`popState` listeners for faster route change detection
2. **Session Element Caching**: Cache found session elements to reduce DOM queries
3. **More Robust Time Parsing**: Support additional time formats and locales
4. **Visual Feedback**: Loading indicators during data fetch
5. **Error UI**: User-visible error messages in overlay

