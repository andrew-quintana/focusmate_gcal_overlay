# Phase 3 Execution Prompt — Background Service Worker

## Objective
Implement the background service worker that handles Google OAuth, Google Calendar API integration, optional Focusmate API integration, and conflict computation. This is the core data layer of the extension.

## Context Documents
- @docs/initiatives/001_initial_implementation/scoping/PRD001.md
- @docs/initiatives/001_initial_implementation/scoping/RFC001.md
- @docs/initiatives/001_initial_implementation/scoping/TODO001.md
- @docs/initiatives/001_initial_implementation/scoping/context.md
- @docs/initiatives/001_initial_implementation/intermediate/phase_2_handoff.md

## Phase Scope
This phase implements the background service worker components:
- Google OAuth authentication management
- Google Calendar API client (primary source of truth)
- Optional Focusmate API client (fallback)
- Conflict computation coordination
- Message handling from content script
- Caching strategy

## Key Requirements

### Google Authentication (`src/background/auth.ts`)
- Implement `GoogleAuthManager` class
- Use `chrome.identity.getAuthToken()` for OAuth
- Support multiple Google accounts
- Handle token refresh on expiration
- Handle 401 errors with token removal and retry

### Google Calendar Client (`src/background/calendar.ts`)
- Implement `GoogleCalendarClient` class
- Fetch events for multiple calendars and calendar groups
- **Critical**: Google Calendar is primary source of truth, especially when Focusmate→Google Calendar sync is enabled
- Implement `getAvailableCalendars()` to support multiple accounts and groups
- Handle API errors (401, rate limits, network errors)
- Implement 60-second caching with TTL
- Normalize events using utility functions from Phase 2

### Focusmate Client (`src/background/focusmate.ts`)
- Implement `FocusmateClient` class (optional)
- **Important**: Focusmate API is optional and not reliable for date ranges
- Treat as fallback only, not foundational
- Handle API key validation
- Handle API errors gracefully

### Conflict Computation (`src/background/conflict.ts`)
- Implement `ConflictComputer` class
- Use `computeConflicts()` utility from Phase 2
- Handle empty sessions/events cases

### Background Service Worker Main (`src/background/background.ts`)
- Initialize service worker
- Set up message listeners for content script
- Handle `FETCH_DATA_FOR_RANGE` messages
- Handle `GET_SETTINGS` messages
- Coordinate between auth, calendar, focusmate, and conflict modules
- Load settings from `chrome.storage.local`
- Implement error handling and logging (gated by debug flag)

## Implementation Tasks

Refer to @docs/initiatives/001_initial_implementation/scoping/TODO001.md Phase 3 section for detailed checklist.

## Validation Requirements

1. **OAuth Flow**: Test Google OAuth authentication (with mocked chrome.identity)
2. **API Integration**: Test Google Calendar API calls (with mocked fetch)
3. **Message Passing**: Test message handling from content script
4. **Caching**: Verify 60-second cache works correctly
5. **Error Handling**: Test error scenarios (401, rate limits, network errors)
6. **Multiple Accounts**: Test support for multiple Google accounts

## Testing Requirements

- Mock Chrome APIs (`chrome.identity`, `chrome.storage`, `chrome.runtime`)
- Mock `fetch` for API calls
- Test OAuth flow with mocked identity API
- Test API error handling
- Test caching behavior
- Test message passing

## Documentation Requirements

After completing this phase, create:

1. **`intermediate/phase_3_decisions.md`**
   - Document OAuth flow implementation
   - Document caching strategy details
   - Document API error handling approach
   - Document multiple account support implementation
   - Document any API limitations discovered

2. **`intermediate/phase_3_testing.md`**
   - Document OAuth flow test results
   - Document API integration test results
   - Document message passing test results
   - Document caching test results
   - Document error handling test results

3. **`intermediate/phase_3_handoff.md`**
   - Document API integration details
   - Document OAuth flow
   - Document any API limitations discovered
   - Document caching strategy
   - Document message protocol
   - Provide clear instructions for Phase 4

## Checklist Updates

As you complete tasks, update the checkboxes in:
- @docs/initiatives/001_initial_implementation/scoping/TODO001.md Phase 3 section

## Important Notes

- **Google Calendar is Primary**: Prefer Google Calendar as source of truth, especially when sync is enabled
- **Focusmate API is Optional**: Treat as fallback, not foundational
- **Multiple Accounts**: Support multiple Google accounts and calendar groups
- **Caching**: 60-second TTL to reduce API calls and stay within rate limits
- **Error Handling**: Graceful error handling with user feedback
- **Debug Logging**: Gate all verbose logs behind debug flag from settings

## Success Criteria

- [ ] OAuth authentication works correctly
- [ ] Google Calendar API integration works
- [ ] Message passing from content script works
- [ ] Caching reduces API calls
- [ ] Error handling is comprehensive
- [ ] Phase 3 handoff document is complete

