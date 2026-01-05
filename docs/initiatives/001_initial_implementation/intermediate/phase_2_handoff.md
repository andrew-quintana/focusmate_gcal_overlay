# Phase 2 Handoff

## Utility Function Interfaces

### Overlap Detection (`src/utils/overlap.ts`)

#### `intervalsOverlap(aStart, aEnd, bStart, bEnd): boolean`
Determines if two time intervals overlap using the standard algorithm: `aStart < bEnd && aEnd > bStart`.

**Parameters**:
- `aStart`: number - Start time of first interval in epoch milliseconds
- `aEnd`: number - End time of first interval in epoch milliseconds (exclusive)
- `bStart`: number - Start time of second interval in epoch milliseconds
- `bEnd`: number - End time of second interval in epoch milliseconds (exclusive)

**Returns**: `boolean` - true if intervals overlap, false otherwise

**Throws**: Error if start > end for any interval

#### `overlapsWithAllDay(eventStartMs, eventEndMs, allDayDateMs): boolean`
Determines if a timed event overlaps with an all-day event.

**Parameters**:
- `eventStartMs`: number - Start time of timed event in epoch milliseconds
- `eventEndMs`: number - End time of timed event in epoch milliseconds
- `allDayDateMs`: number - Date of all-day event (midnight in local time) in epoch milliseconds

**Returns**: `boolean` - true if the timed event overlaps with the all-day event

### Event Normalization (`src/utils/eventNormalization.ts`)

#### `normalizeGCalEvent(apiEvent, calendarId): GCalEvent | null`
Normalizes a Google Calendar API event response to internal GCalEvent format.

**Parameters**:
- `apiEvent`: GoogleCalendarAPIEvent - Raw event from Google Calendar API
- `calendarId`: string - ID of the calendar this event belongs to

**Returns**: `GCalEvent | null` - Normalized event, or null if event should be excluded (cancelled, invalid)

**Throws**: Error if event has invalid date structure

#### `normalizeGCalEvents(apiEvents, calendarId): GCalEvent[]`
Normalizes an array of Google Calendar API events, filtering out invalid/cancelled events.

**Parameters**:
- `apiEvents`: GoogleCalendarAPIEvent[] - Array of raw events from Google Calendar API
- `calendarId`: string - ID of the calendar these events belong to

**Returns**: `GCalEvent[]` - Array of normalized GCalEvent objects

### Session Normalization (`src/utils/sessionNormalization.ts`)

#### `generateSessionKey(startMs, endMs, label?): string`
Generates a session key from time range and optional label.

**Parameters**:
- `startMs`: number - Session start time in epoch milliseconds
- `endMs`: number - Session end time in epoch milliseconds
- `label?`: string - Optional label/title to include in hash

**Returns**: `string` - Derived session key in format `${startMs}-${endMs}-${labelHash}`

#### `normalizeFocusmateSession(apiSession): FocusmateSession | null`
Normalizes a Focusmate API session response to internal FocusmateSession format.

**Parameters**:
- `apiSession`: FocusmateAPISession - Raw session from Focusmate API

**Returns**: `FocusmateSession | null` - Normalized session, or null if invalid

#### `extractSessionsFromDOM(document): FocusmateSession[]`
Extracts Focusmate sessions from DOM. **Note**: This is a placeholder implementation for Phase 2. Will be enhanced in Phase 4.

**Parameters**:
- `document`: Document - Document object to search in

**Returns**: `FocusmateSession[]` - Array of normalized FocusmateSession objects (currently returns empty array)

#### `normalizeFocusmateSessions(apiSessions): FocusmateSession[]`
Normalizes an array of Focusmate API sessions, filtering out invalid sessions.

**Parameters**:
- `apiSessions`: FocusmateAPISession[] - Array of raw sessions from Focusmate API

**Returns**: `FocusmateSession[]` - Array of normalized FocusmateSession objects

### Conflict Detection (`src/utils/conflictDetection.ts`)

#### `computeConflicts(sessions, events): ConflictMap`
Computes conflicts between Focusmate sessions and Google Calendar events.

**Parameters**:
- `sessions`: FocusmateSession[] - Array of Focusmate sessions
- `events`: GCalEvent[] - Array of Google Calendar events

**Returns**: `ConflictMap` - Conflict map: sessionKey -> array of conflicting event IDs

#### `getSessionKey(session): string`
Gets the session key for a given session.

**Parameters**:
- `session`: FocusmateSession - Focusmate session

**Returns**: `string` - Session key string

## Implementation Decisions

### Algorithm Choices
- **Overlap Detection**: Standard interval overlap algorithm (`aStart < bEnd && aEnd > bStart`)
- **All-Day Events**: Treated as covering full day in local time (midnight to next midnight)
- **Session Keys**: Derived from time ranges and optional label hash
- **Conflict Map**: `Record<string, string[]>` format (sessionKey -> eventIds[])

### Timezone Handling
- All time values stored as epoch milliseconds (timezone-agnostic)
- All-day events handled in local time (as per Google Calendar behavior)
- Comparisons use epoch milliseconds directly

### Error Handling
- Invalid inputs throw errors during normalization
- Invalid events/sessions are filtered out (not crash the system)
- Error messages help with debugging

## Test Coverage Metrics

### Overall Coverage
- **Utils Coverage**: 83.36% (above 80% minimum requirement)
- **Critical Paths**: overlap.ts 100%, conflictDetection.ts 97.82%, eventNormalization.ts 96.02%

### Test Results
- **Total Tests**: 63
- **Passing Tests**: 63
- **Failing Tests**: 0
- **Test Execution Time**: ~16-17ms

### Coverage by File
- `overlap.ts`: 100% coverage
- `conflictDetection.ts`: 97.82% coverage
- `eventNormalization.ts`: 96.02% coverage
- `sessionNormalization.ts`: 62.1% coverage (lower due to placeholder DOM extraction)

## Test Fixtures

### Google Calendar
- `tests/fixtures/googleCalendar/events_response.json` - Sample API response with timed events
- `tests/fixtures/googleCalendar/all_day_events.json` - Sample API response with all-day events

### Focusmate
- `tests/fixtures/focusmate/api_response.json` - Sample API response with sessions
- `tests/fixtures/focusmate/dom_structure.html` - Sample DOM structure (for Phase 4)

## Chrome API Mocks

### Mock Implementation
- `tests/mocks/chrome-apis.ts` - Vitest-compatible mocks for Chrome extension APIs
- Mocks available for: `chrome.identity`, `chrome.storage`, `chrome.runtime`

## Instructions for Phase 3

### Prerequisites
1. ✅ All utility functions implemented and tested
2. ✅ Test coverage meets requirements (80% minimum, 95% for critical paths)
3. ✅ All tests passing
4. ✅ Test fixtures created
5. ✅ Chrome API mocks updated for Vitest

### Next Steps

1. **Implement Background Service Worker** (`src/background/`):
   - `auth.ts` - Google OAuth token management
   - `calendar.ts` - Google Calendar API client
   - `focusmate.ts` - Focusmate API client (optional)
   - `conflict.ts` - Conflict computation (uses utility functions)
   - `background.ts` - Main service worker with message handling

2. **Key Integration Points**:
   - Use `normalizeGCalEvent()` from `utils/eventNormalization.ts`
   - Use `normalizeFocusmateSession()` from `utils/sessionNormalization.ts`
   - Use `computeConflicts()` from `utils/conflictDetection.ts`
   - Use `intervalsOverlap()` from `utils/overlap.ts` if needed

3. **Testing**:
   - Use Chrome API mocks from `tests/mocks/chrome-apis.ts`
   - Use test fixtures from `tests/fixtures/`
   - Write unit tests for background modules
   - Test message passing between content script and background

4. **Caching Strategy**:
   - Implement 60-second cache for Google Calendar API responses
   - Cache keyed by `calendarIds + timeMin + timeMax`
   - Clear cache on settings change

### Important Notes

- **Session Keys**: Always use `generateSessionKey()` or `getSessionKey()` for consistent key generation
- **All-Day Events**: Use `overlapsWithAllDay()` for all-day event conflict detection
- **Error Handling**: Follow the pattern established in utility functions (throw for invalid inputs, filter invalid data)
- **Type Safety**: Maintain strict TypeScript typing (no `any` types)
- **Test Coverage**: Maintain 80% minimum coverage for new code

## Known Limitations

1. **DOM Extraction**: `extractSessionsFromDOM()` is a placeholder that returns empty array
   - Will be enhanced in Phase 4 with full DOM extraction logic
   - Requires date context which will be available in Phase 4

2. **Focusmate API**: Focusmate API integration is optional
   - Prefer Google Calendar as source of truth (especially when sync enabled)
   - Focusmate API is fallback only

## Validation Checklist

Before proceeding to Phase 3, verify:
- [x] All utility functions implemented
- [x] All utility functions have comprehensive unit tests
- [x] Test coverage meets 80% minimum (95% for critical paths)
- [x] All tests passing (63/63)
- [x] Test fixtures created
- [x] Chrome API mocks updated for Vitest
- [x] Phase 2 handoff document complete
- [x] Phase 2 decisions document complete
- [x] Phase 2 testing summary complete

## Questions or Issues

If you encounter any issues during Phase 3:
1. Check this handoff document first
2. Review `phase_2_decisions.md` for algorithm choices
3. Review `phase_2_testing.md` for test coverage details
4. Check utility function interfaces above
5. Review test files for usage examples

