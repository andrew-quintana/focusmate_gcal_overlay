# Phase 2 Execution Prompt — Utility Functions & Core Logic

## Objective
Implement pure utility functions for overlap detection, event normalization, session normalization, and conflict computation. These functions form the core logic of the extension and must be highly testable.

## Context Documents
- @docs/initiatives/001_initial_implementation/scoping/PRD001.md
- @docs/initiatives/001_initial_implementation/scoping/RFC001.md
- @docs/initiatives/001_initial_implementation/scoping/TODO001.md
- @docs/initiatives/001_initial_implementation/scoping/context.md
- @docs/initiatives/001_initial_implementation/intermediate/phase_1_handoff.md

## Phase Scope
This phase implements the pure, testable utility functions that will be used throughout the extension:
- Interval overlap detection
- Google Calendar event normalization
- Focusmate session normalization (API and DOM)
- Conflict computation
- Test fixtures and mocks

## Key Requirements

### Overlap Detection (`src/utils/overlap.ts`)
- Implement `intervalsOverlap()` function
- Handle edge cases: adjacent intervals, zero-length intervals
- Support all-day event overlaps
- Algorithm: `aStart < bEnd && aEnd > bStart`

### Event Normalization (`src/utils/eventNormalization.ts`)
- Normalize Google Calendar API responses to `GCalEvent` interface
- Handle all-day events (date vs dateTime)
- Convert timezones to epoch milliseconds
- Exclude cancelled events
- Handle recurring events (already expanded by API)

### Session Normalization (`src/utils/sessionNormalization.ts`)
- `normalizeFocusmateSession()`: Normalize API responses
- `extractSessionsFromDOM()`: Scrape sessions from DOM
- **Critical**: Use derived keys (time range + optional label hash)
- **No reliance on stable DOM IDs** - Focusmate DOM has no stable identifiers
- Generate session keys consistently: `${startMs}-${endMs}-${labelHash}`

### Conflict Detection (`src/utils/conflictDetection.ts`)
- Compute conflict map: `Record<string, string[]>` (sessionKey -> eventIds[])
- Use `intervalsOverlap()` for conflict detection
- Handle all-day event conflicts (treat as full-day coverage)
- Support multiple events conflicting with one session

### Test Fixtures
Create test data in `tests/fixtures/`:
- Google Calendar API response samples
- All-day event examples
- Focusmate API response samples (if available)
- Focusmate DOM structure samples

### Chrome API Mocks
Create mocks in `tests/mocks/chrome-apis.ts`:
- Mock `chrome.identity`
- Mock `chrome.storage`
- Mock `chrome.runtime`

## Implementation Tasks

Refer to @docs/initiatives/001_initial_implementation/scoping/TODO001.md Phase 2 section for detailed checklist.

## Validation Requirements

1. **Unit Tests**: All utility functions have comprehensive unit tests
2. **Test Coverage**: Minimum 80% code coverage (95% for critical paths)
3. **Edge Cases**: All identified edge cases have test cases
4. **Type Safety**: All functions properly typed, no `any` types
5. **Test Execution**: All tests pass locally

## Testing Requirements

- Use Jest or Vitest with TypeScript support
- Tests in `tests/unit/utils/` mirroring source structure
- Test fixtures in `tests/fixtures/`
- Mock Chrome APIs for testing
- Tests must be deterministic and reproducible

## Documentation Requirements

After completing this phase, create:

1. **`intermediate/phase_2_decisions.md`**
   - Document algorithm choices (overlap detection, conflict computation)
   - Document session key generation strategy
   - Document any deviations from RFC
   - Document timezone handling approach

2. **`intermediate/phase_2_testing.md`**
   - Document test coverage results
   - Document edge cases tested
   - Document any test failures and resolutions
   - Include test execution results

3. **`intermediate/phase_2_handoff.md`**
   - Document utility function interfaces
   - Document any implementation decisions
   - Document test coverage metrics
   - Provide clear instructions for Phase 3

## Checklist Updates

As you complete tasks, update the checkboxes in:
- @docs/initiatives/001_initial_implementation/scoping/TODO001.md Phase 2 section

## Important Notes

- **Session Keys**: Always use derived keys from time ranges. No reliance on stable DOM IDs.
- **All-Day Events**: Treat as covering full day in local time
- **Timezone Handling**: Use epoch milliseconds for all comparisons
- **Pure Functions**: All utility functions should be pure (no side effects)
- **Type Safety**: Strict TypeScript, no `any` types without justification

## Success Criteria

- [ ] All utility functions implemented and tested
- [ ] Test coverage meets 80% minimum (95% for critical paths)
- [ ] All edge cases handled correctly
- [ ] Test fixtures and mocks created
- [ ] Phase 2 handoff document is complete

