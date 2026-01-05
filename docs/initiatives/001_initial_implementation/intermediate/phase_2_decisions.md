# Phase 2 Decisions

## Algorithm Choices

### Overlap Detection Algorithm

**Decision**: Use standard interval overlap algorithm: `aStart < bEnd && aEnd > bStart`

**Rationale**:
- This is the standard mathematical definition of interval overlap
- Handles all cases correctly: partial overlaps, full containment, adjacent intervals
- Adjacent intervals (touching at boundaries) are correctly identified as non-overlapping
- Zero-length intervals (points) are handled correctly

**Edge Cases Handled**:
- Adjacent intervals return `false` (not overlapping)
- Zero-length intervals (points) are handled correctly
- Very small intervals work as expected
- Large epoch timestamps work correctly

### All-Day Event Overlap Detection

**Decision**: Treat all-day events as covering the full day in local time (midnight to next midnight)

**Rationale**:
- All-day events in Google Calendar are date-based, not time-based
- They should conflict with any timed event on the same calendar day
- Using local time ensures correct behavior across timezones

**Implementation**:
- All-day events are normalized to start at midnight (00:00:00) and end at next midnight (24:00:00) in local time
- `overlapsWithAllDay()` function checks if a timed event overlaps with the full day range

### Session Key Generation Strategy

**Decision**: Use derived keys from time ranges and optional label hash: `${startMs}-${endMs}-${labelHash}`

**Rationale**:
- Focusmate DOM has no stable identifiers (React-based SPA with hashed class names)
- Derived keys are more reliable than DOM attributes
- Consistent key generation ensures conflict detection works correctly
- Label hash provides additional uniqueness when sessions have titles

**Implementation**:
- `generateSessionKey()` function creates keys from observable attributes
- Uses djb2 hash algorithm for label hashing
- Keys are deterministic and consistent for same inputs

### Conflict Computation Strategy

**Decision**: Generate conflict map as `Record<string, string[]>` (sessionKey -> eventIds[])

**Rationale**:
- Allows multiple events to conflict with one session
- Efficient lookup by session key
- Supports the content script's need to apply styling based on session keys

**Implementation**:
- `computeConflicts()` iterates through sessions and events
- Uses `intervalsOverlap()` for timed events
- Uses `overlapsWithAllDay()` for all-day events
- Only includes sessions with conflicts in the map

### Event Normalization Strategy

**Decision**: Normalize Google Calendar API events to internal `GCalEvent` format with epoch milliseconds

**Rationale**:
- Epoch milliseconds provide a consistent time representation for comparisons
- All-day events handled separately with date-based parsing
- Excludes cancelled events automatically
- Handles missing fields gracefully (defaults for end time, optional summary/htmlLink)

**Implementation**:
- `normalizeGCalEvent()` handles both timed and all-day events
- Converts ISO 8601 datetime strings to epoch milliseconds
- Validates date ranges and throws errors for invalid data
- `normalizeGCalEvents()` filters out invalid/cancelled events

### Session Normalization Strategy

**Decision**: Support both API and DOM-based session extraction (API preferred, DOM as fallback)

**Rationale**:
- Focusmate API is optional and not fully productized
- DOM scraping is fallback when API unavailable
- API normalization handles various field name variations
- DOM extraction is placeholder for Phase 4 (requires date context)

**Implementation**:
- `normalizeFocusmateSession()` handles API responses with multiple field name variations
- `extractSessionsFromDOM()` is placeholder implementation (will be enhanced in Phase 4)
- Session keys generated consistently for both sources

## Timezone Handling Approach

**Decision**: Use epoch milliseconds for all time comparisons

**Rationale**:
- Epoch milliseconds are timezone-agnostic (UTC-based)
- Eliminates timezone conversion errors
- Consistent comparisons across different timezones
- All-day events handled in local time (as per Google Calendar behavior)

**Implementation**:
- All time values stored as epoch milliseconds
- Google Calendar API datetime strings converted to epoch milliseconds
- All-day events parsed as local midnight boundaries
- Comparisons use epoch milliseconds directly

## Deviations from RFC

**No deviations**: All implementations follow the RFC001.md specifications exactly.

## Type Safety

**Decision**: Strict TypeScript with no `any` types

**Rationale**:
- Type safety prevents runtime errors
- Better IDE support and autocomplete
- Easier refactoring and maintenance

**Implementation**:
- All functions properly typed
- Interface definitions for API responses
- No `any` types used (except in mock setup where necessary)
- Type definitions match RFC specifications

## Test Coverage Strategy

**Decision**: Comprehensive unit tests with 80% minimum coverage (95% for critical paths)

**Rationale**:
- High test coverage ensures correctness
- Critical paths (overlap detection, conflict computation) need highest coverage
- Edge cases must be tested to prevent regressions

**Results**:
- Overall utils coverage: 83.36% (above 80% requirement)
- Critical paths: overlap.ts 100%, conflictDetection.ts 97.82%, eventNormalization.ts 96.02%
- sessionNormalization.ts: 62.1% (lower due to placeholder DOM extraction function)

## Error Handling Strategy

**Decision**: Throw errors for invalid inputs, filter out invalid events/sessions

**Rationale**:
- Invalid data should fail fast during normalization
- Invalid events/sessions should be filtered out, not crash the system
- Error messages help with debugging

**Implementation**:
- `normalizeGCalEvent()` throws errors for invalid date structures
- `normalizeGCalEvents()` catches errors and continues processing
- `normalizeFocusmateSession()` returns null for invalid sessions
- `normalizeFocusmateSessions()` filters out null results

