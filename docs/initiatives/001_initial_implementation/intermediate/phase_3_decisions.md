# Phase 3 Decisions

## OAuth Flow Implementation

### Decision: Use Chrome Identity API for OAuth
**Rationale**: Chrome Identity API (`chrome.identity.getAuthToken`) is the standard way to handle OAuth in Manifest V3 extensions. It handles token storage, refresh, and user consent automatically.

**Implementation Details**:
- Request scope: `https://www.googleapis.com/auth/calendar.readonly`
- Support interactive and non-interactive token requests
- Handle user cancellation gracefully
- Automatic token refresh on 401 errors

### Decision: Token Refresh Strategy
**Rationale**: When a 401 error occurs, the token is likely expired or invalid. We remove the cached token and request a new one.

**Implementation**:
- `handle401Error()` method removes cached token and requests new token
- Retry logic in `GoogleCalendarClient` automatically handles 401 errors
- Maximum one retry per request to avoid infinite loops

## Caching Strategy Details

### Decision: 60-Second In-Memory Cache
**Rationale**: Google Calendar API has rate limits. Caching reduces API calls while keeping data reasonably fresh.

**Implementation Details**:
- Cache key: `calendarIds:timeMin:timeMax` (sorted calendar IDs)
- TTL: 60 seconds
- Cache cleared when:
  - Settings change (calendar selection)
  - Manual `clearCache()` call
- Cache stored in memory (not persisted across service worker restarts)

**Trade-offs**:
- Memory usage: Minimal (events are small objects)
- Freshness: 60 seconds is acceptable for calendar data
- Service worker restarts: Cache is lost, but this is acceptable

## API Error Handling Approach

### Decision: Graceful Degradation
**Rationale**: Extension should continue working even if some APIs fail.

**Implementation**:
- **Google Calendar API**: Critical - errors are propagated (user needs calendar data)
- **Focusmate API**: Optional - errors return empty array (graceful degradation)
- **401 Errors**: Automatic token refresh with retry
- **Rate Limits**: Logged but not retried (user should wait)
- **Network Errors**: Logged and propagated for Google Calendar, ignored for Focusmate

### Decision: Error Logging
**Rationale**: Debug logging should be gated by settings to avoid console spam.

**Implementation**:
- All verbose logs check `settings.debugLogging` flag
- Errors are always logged (even when debug logging disabled)
- User-friendly error messages in responses

## Multiple Account Support Implementation

### Decision: Support Multiple Google Accounts
**Rationale**: Users may have multiple Google accounts with calendars. Extension should support all accounts.

**Implementation**:
- `calendarIds` array in settings can contain calendars from multiple accounts
- `getAvailableCalendars()` fetches all calendars user has access to
- Calendar list includes account information (when available from API)
- Calendar selection UI (Phase 5) will organize by account

**Limitations**:
- Google Calendar API doesn't directly expose account/group metadata
- Calendar IDs are used to identify calendars
- Account grouping requires additional API calls (future enhancement)

## API Limitations Discovered

### Google Calendar API
- **Rate Limits**: 1,000,000 queries per day per project (sufficient for our use case)
- **Pagination**: `maxResults=2500` is safe cap (rarely exceeded)
- **Account Metadata**: Not directly available in calendar list response
- **Calendar Groups**: Supported but require additional API calls to identify

### Focusmate API
- **Date Range Querying**: Not guaranteed to support explicit date ranges
- **API Stability**: User-scoped, not fully productized
- **Authentication**: API key only (no OAuth, no refresh tokens)
- **Design Implication**: Treat as optional fallback, prefer Google Calendar as source of truth

## Message Protocol

### Decision: Async Message Handling
**Rationale**: Service worker message handlers must return `true` to indicate async response.

**Implementation**:
- All message handlers return `true`
- Responses sent via `sendResponse()` callback
- Error handling wraps all message handlers in try-catch

### Decision: Message Types
**Rationale**: Clear message types improve type safety and maintainability.

**Implementation**:
- `FETCH_DATA_FOR_RANGE`: Request events, sessions, and conflicts for date range
- `GET_SETTINGS`: Request current extension settings
- All messages and responses are strongly typed

## Settings Management

### Decision: Storage Change Listeners
**Rationale**: Settings changes should update service worker state immediately.

**Implementation**:
- `chrome.storage.onChanged` listener updates settings in real-time
- Cache cleared when calendar selection changes
- Focusmate API key updated immediately when changed

### Decision: Default Settings
**Rationale**: Sensible defaults improve user experience.

**Implementation**:
- `overlayEnabled`: `true` (overlay shown by default)
- `conflictColor`: `"#ff6b6b"` (red highlight)
- `calendarIds`: `["primary"]` (primary calendar)
- `focusmateApiKey`: `null` (optional)
- `debugLogging`: `false` (no verbose logs by default)

## Testing Strategy

### Decision: Mock Chrome APIs
**Rationale**: Tests should not depend on actual Chrome extension environment.

**Implementation**:
- `tests/mocks/chrome-apis.ts` provides Vitest-compatible mocks
- Mocks support all Chrome APIs used by background service worker
- Tests are deterministic and fast

### Decision: Test Coverage
**Rationale**: Background service worker is critical path - needs comprehensive tests.

**Implementation**:
- Unit tests for all background modules
- Test error scenarios (401, rate limits, network errors)
- Test caching behavior
- Test message passing
- 32 tests total, all passing

