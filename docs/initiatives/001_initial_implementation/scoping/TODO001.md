# TODO 001 — Focusmate Calendar Overlay Chrome Extension (Implementation Breakdown)

## Phase 0 — Context Harvest & Setup

- [ ] Review adjacent components in @docs/initiatives/001_initial_implementation/scoping/context.md
- [ ] Review PRD001.md and RFC001.md for complete understanding
- [ ] Validate TypeScript toolchain and build requirements
- [ ] **Create fracas.md** in root directory for failure tracking using FRACAS methodology
- [ ] Block: Implementation cannot proceed until Phase 0 complete

## Phase 1 — TypeScript Project Setup & Foundation

### Setup Tasks

- [ ] Initialize TypeScript project with `tsconfig.json`
  - [ ] Enable strict mode
  - [ ] Configure compilation target (ES2020)
  - [ ] Set up module resolution
  - [ ] Configure source maps for debugging

- [ ] Set up build tooling
  - [ ] Choose and configure build tool (webpack/rollup/esbuild)
  - [ ] Configure build to output to `dist/` directory
  - [ ] Set up watch mode for development
  - [ ] Configure build scripts in `package.json`

- [ ] Create project directory structure
  - [ ] Create `src/` directory with subdirectories (background/, content/, options/, popup/, types/, utils/)
  - [ ] Create `dist/` directory for compiled output
  - [ ] Create `tests/` directory with fixtures/ and unit/ subdirectories

- [ ] Set up Chrome extension manifest
  - [ ] Update `manifest.json` to reference compiled JavaScript files in `dist/`
  - [ ] Configure permissions: `identity`, `storage`, `scripting`
  - [ ] Configure host permissions for `https://app.focusmate.com/*` and `https://www.googleapis.com/*`
  - [ ] Set up content scripts configuration

- [ ] Install dependencies
  - [ ] Install TypeScript and type definitions
  - [ ] Install build tool dependencies
  - [ ] Install testing framework (Jest/Vitest) and TypeScript support
  - [ ] Install `@types/chrome` for Chrome API types (if available)

### Type Definitions

- [ ] Create `src/types/events.ts`
  - [ ] Define `GCalEvent` interface
  - [ ] Define `FocusmateSession` interface
  - [ ] Define `ConflictMap` type

- [ ] Create `src/types/messages.ts`
  - [ ] Define `FetchDataForRangeMessage` interface
  - [ ] Define `RangeDataResponse` interface
  - [ ] Define `GetSettingsMessage` and `SettingsResponse` interfaces

- [ ] Create `src/types/storage.ts`
  - [ ] Define `ExtensionSettings` interface
  - [ ] Define storage key constants

### Phase 1 Testing

- [ ] **Phase 1 Testing Summary** (`intermediate/phase_1_testing.md`)
  - [ ] Verify TypeScript compilation succeeds
  - [ ] Verify build output structure
  - [ ] Verify manifest.json references correct files
  - [ ] Test extension loads in Chrome (Developer Mode)

### Phase 1 Handoff

- [ ] **Phase 1 Handoff** (`intermediate/phase_1_handoff.md`)
  - [ ] Document build process and commands
  - [ ] Document project structure
  - [ ] Document any setup issues encountered

## Phase 2 — Utility Functions & Core Logic

### Utility Functions Implementation

- [ ] Implement `src/utils/overlap.ts`
  - [ ] Create `intervalsOverlap()` function
  - [ ] Handle edge cases (adjacent intervals, zero-length)
  - [ ] Add JSDoc comments
  - [ ] Write unit tests in `tests/unit/utils/overlap.test.ts`

- [ ] Implement `src/utils/eventNormalization.ts`
  - [ ] Create `normalizeGCalEvent()` function
  - [ ] Handle all-day events (date vs dateTime)
  - [ ] Handle timezone conversion to epoch milliseconds
  - [ ] Exclude cancelled events
  - [ ] Write unit tests in `tests/unit/utils/eventNormalization.test.ts`

- [ ] Implement `src/utils/sessionNormalization.ts`
  - [ ] Create `normalizeFocusmateSession()` function (for API)
  - [ ] Create `extractSessionsFromDOM()` function (for DOM scraping)
  - [ ] Implement session key generation logic
  - [ ] Write unit tests in `tests/unit/utils/sessionNormalization.test.ts`

- [ ] Implement `src/utils/conflictDetection.ts`
  - [ ] Create `computeConflicts()` function
  - [ ] Use `intervalsOverlap()` for conflict detection
  - [ ] Generate conflict map (sessionKey -> eventIds[])
  - [ ] Handle all-day event conflicts
  - [ ] Write unit tests in `tests/unit/utils/conflictDetection.test.ts`

### Test Fixtures

- [ ] Create test fixtures in `tests/fixtures/`
  - [ ] `googleCalendar/events_response.json` - Sample Google Calendar API response
  - [ ] `googleCalendar/all_day_events.json` - All-day event examples
  - [ ] `focusmate/api_response.json` - Sample Focusmate API response (if available)
  - [ ] `focusmate/dom_structure.html` - Sample Focusmate DOM structure

- [ ] Create Chrome API mocks in `tests/mocks/chrome-apis.ts`
  - [ ] Mock `chrome.identity`
  - [ ] Mock `chrome.storage`
  - [ ] Mock `chrome.runtime`

### Phase 2 Testing

- [ ] **Phase 2 Testing Summary** (`intermediate/phase_2_testing.md`)
  - [ ] All utility function unit tests pass
  - [ ] Test coverage meets 80% minimum
  - [ ] Edge cases handled correctly
  - [ ] All-day event conflicts work correctly

### Phase 2 Handoff

- [ ] **Phase 2 Handoff** (`intermediate/phase_2_handoff.md`)
  - [ ] Document utility function interfaces
  - [ ] Document any implementation decisions
  - [ ] Document test coverage results

## Phase 3 — Background Service Worker

### Google Calendar Integration

- [ ] Implement `src/background/auth.ts`
  - [ ] Create `GoogleAuthManager` class
  - [ ] Implement `getAuthToken()` using `chrome.identity.getAuthToken()`
  - [ ] Implement `refreshToken()` for token refresh
  - [ ] Implement `removeCachedToken()` for error recovery
  - [ ] Handle OAuth errors and user cancellation

- [ ] Implement `src/background/calendar.ts`
  - [ ] Create `GoogleCalendarClient` class
  - [ ] Implement `fetchEvents()` method
  - [ ] Handle API request with proper query parameters (timeMin, timeMax, singleEvents, orderBy)
  - [ ] Implement response normalization using `normalizeGCalEvent()`
  - [ ] Handle API errors (401, rate limits, network errors)
  - [ ] Implement caching with 60-second TTL

- [ ] Implement `src/background/focusmate.ts`
  - [ ] Create `FocusmateClient` class
  - [ ] Implement API-based session fetching (if API available)
  - [ ] Implement fallback DOM-based session extraction (if needed)
  - [ ] Handle API key validation
  - [ ] Handle API errors gracefully

- [ ] Implement `src/background/conflict.ts`
  - [ ] Create `ConflictComputer` class
  - [ ] Use `computeConflicts()` utility function
  - [ ] Handle empty sessions/events cases

### Background Service Worker Main

- [ ] Implement `src/background/background.ts`
  - [ ] Initialize service worker
  - [ ] Set up message listeners for content script communication
  - [ ] Handle `FETCH_DATA_FOR_RANGE` messages
  - [ ] Handle `GET_SETTINGS` messages
  - [ ] Coordinate between auth, calendar, focusmate, and conflict modules
  - [ ] Implement error handling and logging
  - [ ] Load settings from `chrome.storage.local`

### Phase 3 Testing

- [ ] **Phase 3 Testing Summary** (`intermediate/phase_3_testing.md`)
  - [ ] Test OAuth flow (with mocked chrome.identity)
  - [ ] Test Google Calendar API integration (with mocked fetch)
  - [ ] Test message passing from content script
  - [ ] Test caching behavior
  - [ ] Test error handling scenarios

### Phase 3 Handoff

- [ ] **Phase 3 Handoff** (`intermediate/phase_3_handoff.md`)
  - [ ] Document API integration details
  - [ ] Document OAuth flow
  - [ ] Document any API limitations discovered
  - [ ] Document caching strategy

## Phase 4 — Content Script & Overlay UI

### DOM Detection

- [ ] Implement `src/content/domDetector.ts`
  - [ ] Create `FocusmateDOMDetector` class
  - [ ] Implement `detectDateRange()` - extract visible date range from Focusmate UI
  - [ ] Implement `extractSessionsFromDOM()` - scrape sessions from DOM
  - [ ] Implement `findSessionElements()` - find session DOM elements
  - [ ] Implement `getSessionKey()` - extract or generate session key from element
  - [ ] Implement multiple selector strategies with fallbacks
  - [ ] Handle Focusmate route changes and SPA navigation

### Overlay UI

- [ ] Implement `src/content/overlay.ts`
  - [ ] Create `CalendarOverlay` class
  - [ ] Create Shadow DOM container
  - [ ] Implement `render()` - display events in overlay
  - [ ] Implement `updateDateRange()` - update displayed range
  - [ ] Implement `toggleVisibility()` - show/hide overlay
  - [ ] Implement collapse/expand functionality
  - [ ] Style overlay with CSS (isolated in Shadow DOM)
  - [ ] Add event click handlers to open Google Calendar links
  - [ ] Implement `destroy()` for cleanup

### Conflict Styling

- [ ] Implement `src/content/conflictStyling.ts`
  - [ ] Create `ConflictStyler` class
  - [ ] Implement `applyConflicts()` - add CSS classes to conflicting sessions
  - [ ] Implement `clearConflicts()` - remove conflict styling
  - [ ] Inject CSS styles (via Shadow DOM or document head)
  - [ ] Use configurable conflict color from settings
  - [ ] Add tooltips or indicators showing conflicting events

### MutationObserver & Lifecycle

- [ ] Implement `src/content/content.ts`
  - [ ] Initialize content script on Focusmate page load
  - [ ] Set up MutationObserver on calendar grid container
  - [ ] Debounce MutationObserver callbacks (200ms)
  - [ ] Detect Focusmate route changes
  - [ ] Request data from background service worker
  - [ ] Coordinate overlay rendering and conflict styling
  - [ ] Handle settings changes (re-render on settings update)
  - [ ] Implement error handling and user feedback

### Phase 4 Testing

- [ ] **Phase 4 Testing Summary** (`intermediate/phase_4_testing.md`)
  - [ ] Test overlay rendering on Focusmate page
  - [ ] Test conflict highlighting
  - [ ] Test MutationObserver behavior
  - [ ] Test overlay persistence across route changes
  - [ ] Test DOM selector strategies
  - [ ] Manual testing in Chrome with real Focusmate page

### Phase 4 Handoff

- [ ] **Phase 4 Handoff** (`intermediate/phase_4_handoff.md`)
  - [ ] Document DOM selector strategies used
  - [ ] Document any Focusmate DOM structure discoveries
  - [ ] Document overlay positioning and styling decisions
  - [ ] Document MutationObserver implementation details

## Phase 5 — Options Page

### Settings Management

- [ ] Implement `src/options/settingsManager.ts`
  - [ ] Create `SettingsManager` class
  - [ ] Implement `loadSettings()` - load from `chrome.storage.local`
  - [ ] Implement `saveSettings()` - save to `chrome.storage.local`
  - [ ] Implement `getAvailableCalendars()` - fetch calendar list from Google
  - [ ] Handle default values
  - [ ] Validate settings before saving

### Options UI

- [ ] Update `options.html`
  - [ ] Create form structure
  - [ ] Add calendar selection UI (multi-select or checkboxes)
  - [ ] Add color picker for conflict color
  - [ ] Add toggle switches for overlay enabled and debug logging
  - [ ] Add input field for Focusmate API key (optional)
  - [ ] Add save/cancel buttons
  - [ ] Add status messages for save feedback

- [ ] Implement `src/options/options.ts`
  - [ ] Create `OptionsUI` class
  - [ ] Implement `render()` - populate form with current settings
  - [ ] Implement `bindEventHandlers()` - handle form interactions
  - [ ] Implement `validateInput()` - validate user input
  - [ ] Handle form submission
  - [ ] Show success/error messages
  - [ ] Load available calendars and populate selection

- [ ] Style options page (`styles/options.css`)
  - [ ] Modern, clean design
  - [ ] Responsive layout
  - [ ] Accessible form elements
  - [ ] Clear labels and instructions

### Phase 5 Testing

- [ ] **Phase 5 Testing Summary** (`intermediate/phase_5_testing.md`)
  - [ ] Test settings load and save
  - [ ] Test calendar selection
  - [ ] Test input validation
  - [ ] Test settings persistence across browser sessions
  - [ ] Test settings changes reflect in content script

### Phase 5 Handoff

- [ ] **Phase 5 Handoff** (`intermediate/phase_5_handoff.md`)
  - [ ] Document settings schema
  - [ ] Document UI/UX decisions
  - [ ] Document any validation rules

## Phase 6 — Integration, Polish & Validation

### Integration Tasks

- [ ] End-to-end integration testing
  - [ ] Test complete flow: OAuth → fetch events → detect sessions → compute conflicts → render overlay → highlight conflicts
  - [ ] Test with real Google Calendar account
  - [ ] Test with real Focusmate account
  - [ ] Test error scenarios (network failures, API errors, token expiration)

- [ ] Error handling improvements
  - [ ] Add user-friendly error messages
  - [ ] Handle all error cases gracefully
  - [ ] Add retry logic where appropriate
  - [ ] Log errors for debugging (when debug logging enabled)

- [ ] Performance optimization
  - [ ] Verify debouncing works correctly
  - [ ] Verify caching reduces API calls
  - [ ] Profile overlay rendering performance
  - [ ] Optimize DOM queries and selectors

### Documentation Tasks

- [ ] Code documentation
  - [ ] Add JSDoc comments to all public functions
  - [ ] Document complex algorithms (overlap detection, conflict computation)
  - [ ] Document Chrome API usage patterns
  - [ ] Document build and development process

- [ ] Create `summary.md` in root directory
  - [ ] Summarize implementation approach
  - [ ] Document key decisions made
  - [ ] Document known limitations
  - [ ] Provide usage instructions

- [ ] Create `technical_debt.md` in root directory (if applicable)
  - [ ] Document testing gaps
  - [ ] Document known issues
  - [ ] Document future improvements needed
  - [ ] Document DOM selector fragility concerns

### Validation Tasks

- [ ] Manual testing checklist
  - [ ] Install extension in Chrome (Developer Mode)
  - [ ] Open Focusmate page
  - [ ] Verify overlay appears
  - [ ] Complete Google OAuth flow
  - [ ] Verify calendar events display
  - [ ] Create test calendar event overlapping Focusmate session
  - [ ] Verify conflict highlighting works
  - [ ] Test options page configuration
  - [ ] Verify settings persistence
  - [ ] Test overlay toggle
  - [ ] Test across Focusmate route changes
  - [ ] Test with multiple calendars
  - [ ] Test with all-day events
  - [ ] Test error scenarios

- [ ] Performance validation
  - [ ] Measure overlay render time (< 500ms target)
  - [ ] Measure conflict computation time (< 100ms target)
  - [ ] Verify API caching works
  - [ ] Check memory usage

- [ ] Security review
  - [ ] Verify no data exfiltration
  - [ ] Verify OAuth token handling
  - [ ] Verify API key storage
  - [ ] Review Content Security Policy compliance

### Phase 6 Testing

- [ ] **Phase 6 Testing Summary** (`intermediate/phase_6_testing.md`)
  - [ ] Document all manual test results
  - [ ] Document performance measurements
  - [ ] Document any issues found
  - [ ] Document resolution of issues

### Phase 6 Handoff

- [ ] **Phase 6 Handoff** (`intermediate/phase_6_handoff.md`)
  - [ ] Document final state of implementation
  - [ ] Document any remaining issues
  - [ ] Document deployment instructions

## Initiative Completion

- [ ] **Final Testing Summary** - Comprehensive testing report across all phases
- [ ] **Technical Debt Documentation** - Complete technical debt catalog in `technical_debt.md`
- [ ] **Summary Document** - Complete `summary.md` with implementation overview
- [ ] All TODO checkboxes completed
- [ ] All phase handoff documents completed
- [ ] All phase testing summaries completed
- [ ] Code review completed (if applicable)
- [ ] Documentation review completed

## File Organization Requirements

This section specifies where different types of files created during implementation should be placed.

### Source Code Files

- **TypeScript Source Files**: All `.ts` files go in `src/` directory
  - `src/background/` - Background service worker code
  - `src/content/` - Content script code
  - `src/options/` - Options page code
  - `src/popup/` - Popup code (if needed)
  - `src/types/` - TypeScript type definitions
  - `src/utils/` - Utility functions

- **HTML Files**: HTML files go in root or respective directories
  - `options.html` - Options page HTML (root or `src/options/`)
  - `popup.html` - Popup HTML (root or `src/popup/`)

- **CSS Files**: CSS files go in `styles/` directory
  - `styles/options.css` - Options page styles
  - `styles/popup.css` - Popup styles (if needed)

- **Compiled JavaScript**: Compiled `.js` files go in `dist/` directory
  - Structure mirrors `src/` directory structure

### Test Files

- **Unit Tests**: Test files go in `tests/unit/` directory
  - Mirror source structure: `tests/unit/utils/`, `tests/unit/background/`, etc.
  - Naming: `{filename}.test.ts`

- **Test Fixtures**: Fixture files go in `tests/fixtures/` directory
  - `tests/fixtures/googleCalendar/` - Google Calendar API response samples
  - `tests/fixtures/focusmate/` - Focusmate API/DOM samples
  - `tests/fixtures/mocks/` - Mock implementations

### Documentation Files

- **Scoping Documents**: Go in `scoping/` directory
  - `PRD001.md`, `RFC001.md`, `TODO001.md`, `context.md`

- **Phase Prompts**: Go in `prompts/` directory
  - `prompt_phase_1.md`, `prompt_phase_2.md`, etc.

- **Intermediate Documents**: Go in `intermediate/` directory
  - `phase_1_decisions.md`, `phase_1_testing.md`, `phase_1_handoff.md`
  - One set per phase

- **Notes**: Go in `notes/` directory
  - Create subdirectories for categories: `notes/research/`, `notes/troubleshooting/`, etc.
  - Use descriptive names with underscores: `focusmate_api_research.md`

- **Summary Documents**: Go in root initiative directory
  - `summary.md` - Final summary (required)
  - `technical_debt.md` - Technical debt documentation (optional)
  - `fracas.md` - Failure tracking (created in Phase 0)

### Configuration Files

- **Build Configuration**: Go in root directory
  - `tsconfig.json` - TypeScript configuration
  - `package.json` - Node.js dependencies and scripts
  - `webpack.config.js` or `rollup.config.js` - Build tool configuration

- **Chrome Extension Files**: Go in root directory
  - `manifest.json` - Extension manifest
  - `.gitignore` - Git ignore rules

### File Naming Conventions

- **TypeScript Files**: Use camelCase: `background.ts`, `eventNormalization.ts`
- **Test Files**: Use camelCase with `.test.ts` suffix: `overlap.test.ts`
- **HTML Files**: Use kebab-case: `options.html`, `popup.html`
- **CSS Files**: Use kebab-case: `options.css`
- **Documentation Files**: Use kebab-case or descriptive names: `phase_1_decisions.md`, `summary.md`
- **Fixture Files**: Use descriptive names: `events_response.json`, `all_day_events.json`

### When to Create Subdirectories

- **In `notes/`**: Create subdirectories for distinct categories
  - `notes/research/` - Research findings
  - `notes/troubleshooting/` - Troubleshooting guides
  - `notes/deployment/` - Deployment notes
  - Only create subdirectories when you have multiple files in a category

- **In `src/`**: Always use subdirectories for component organization
  - `src/background/`, `src/content/`, `src/options/`, `src/types/`, `src/utils/`

- **In `tests/`**: Use subdirectories to mirror source structure
  - `tests/unit/utils/`, `tests/unit/background/`

### Examples

- Deployment verification results → `notes/deployment/verification_results.md`
- Phase 2 testing results → `intermediate/phase_2_testing.md`
- Research on Focusmate API → `notes/research/focusmate_api_endpoints.md`
- TypeScript utility function → `src/utils/overlap.ts`
- Unit test for utility → `tests/unit/utils/overlap.test.ts`
- Google Calendar API response sample → `tests/fixtures/googleCalendar/events_response.json`

## Blockers

- None currently identified

## Notes

- All implementation must be in TypeScript
- Build process must compile TypeScript to JavaScript for Chrome extension runtime
- Focus on day view first, extend to week view later if straightforward
- Centralize DOM selector logic for easy updates
- Use Shadow DOM for overlay styling isolation
- Add debounce around MutationObserver callbacks
- Keep code readable; prioritize robustness over micro-optimizations
- Include DEBUG flag from storage; gate all verbose logs behind it

## FRACAS Integration

- **Failure Tracking**: All failures, bugs, and unexpected behaviors must be documented in `fracas.md`
- **Investigation Process**: Follow systematic FRACAS methodology for root cause analysis
- **Knowledge Building**: Use failure modes to build organizational knowledge and prevent recurrence
- **Status Management**: Keep failure mode statuses current and move resolved issues to historical section

**FRACAS Document Location**: `docs/initiatives/001_initial_implementation/fracas.md`
