# TODO 001 — Focusmate Calendar Overlay Chrome Extension (Implementation Breakdown)

## Phase 0 — Context Harvest & Setup

- [ ] Review adjacent components in @docs/initiatives/001_initial_implementation/scoping/context.md
- [ ] Review PRD001.md and RFC001.md for complete understanding
- [ ] Validate TypeScript toolchain and build requirements
- [ ] **Create fracas.md** in root directory for failure tracking using FRACAS methodology
- [ ] Block: Implementation cannot proceed until Phase 0 complete

## Phase 1 — TypeScript Project Setup & Foundation

### Setup Tasks

- [x] Initialize TypeScript project with `tsconfig.json`
  - [x] Enable strict mode
  - [x] Configure compilation target (ES2020)
  - [x] Set up module resolution
  - [x] Configure source maps for debugging

- [x] Set up build tooling
  - [x] Choose and configure build tool (webpack/rollup/esbuild)
  - [x] Configure build to output to `dist/` directory
  - [x] Set up watch mode for development
  - [x] Configure build scripts in `package.json`

- [x] Create project directory structure
  - [x] Create `src/` directory with subdirectories (background/, content/, options/, popup/, types/, utils/)
  - [x] Create `dist/` directory for compiled output
  - [x] Create `tests/` directory with fixtures/ and unit/ subdirectories

- [x] Set up Chrome extension manifest
  - [x] Update `manifest.json` to reference compiled JavaScript files in `dist/`
  - [x] Configure permissions: `identity`, `storage`, `scripting`
  - [x] Configure host permissions for `https://app.focusmate.com/*` and `https://www.googleapis.com/*`
  - [x] Set up content scripts configuration

- [x] Install dependencies
  - [x] Install TypeScript and type definitions
  - [x] Install build tool dependencies
  - [x] Install testing framework (Jest/Vitest) and TypeScript support
  - [x] Install `@types/chrome` for Chrome API types (if available)

### Type Definitions

- [x] Create `src/types/events.ts`
  - [x] Define `GCalEvent` interface
  - [x] Define `FocusmateSession` interface
  - [x] Define `ConflictMap` type

- [x] Create `src/types/messages.ts`
  - [x] Define `FetchDataForRangeMessage` interface
  - [x] Define `RangeDataResponse` interface
  - [x] Define `GetSettingsMessage` and `SettingsResponse` interfaces

- [x] Create `src/types/storage.ts`
  - [x] Define `ExtensionSettings` interface
  - [x] Define storage key constants

### Phase 1 Testing

- [x] **Phase 1 Testing Summary** (`intermediate/phase_1_testing.md`)
  - [x] Verify TypeScript compilation succeeds
  - [x] Verify build output structure
  - [x] Verify manifest.json references correct files
  - [ ] Test extension loads in Chrome (Developer Mode) - Manual test pending

### Phase 1 Handoff

- [x] **Phase 1 Handoff** (`intermediate/phase_1_handoff.md`)
  - [x] Document build process and commands
  - [x] Document project structure
  - [x] Document any setup issues encountered

## Phase 2 — Utility Functions & Core Logic

### Utility Functions Implementation

- [x] Implement `src/utils/overlap.ts`
  - [x] Create `intervalsOverlap()` function
  - [x] Handle edge cases (adjacent intervals, zero-length)
  - [x] Add JSDoc comments
  - [x] Write unit tests in `tests/unit/utils/overlap.test.ts`

- [x] Implement `src/utils/eventNormalization.ts`
  - [x] Create `normalizeGCalEvent()` function
  - [x] Handle all-day events (date vs dateTime)
  - [x] Handle timezone conversion to epoch milliseconds
  - [x] Exclude cancelled events
  - [x] Write unit tests in `tests/unit/utils/eventNormalization.test.ts`

- [x] Implement `src/utils/sessionNormalization.ts`
  - [x] Create `normalizeFocusmateSession()` function (for API)
  - [x] Create `extractSessionsFromDOM()` function (for DOM scraping) - placeholder for Phase 4
  - [x] Implement session key generation logic
  - [x] Write unit tests in `tests/unit/utils/sessionNormalization.test.ts`

- [x] Implement `src/utils/conflictDetection.ts`
  - [x] Create `computeConflicts()` function
  - [x] Use `intervalsOverlap()` for conflict detection
  - [x] Generate conflict map (sessionKey -> eventIds[])
  - [x] Handle all-day event conflicts
  - [x] Write unit tests in `tests/unit/utils/conflictDetection.test.ts`

### Test Fixtures

- [x] Create test fixtures in `tests/fixtures/`
  - [x] `googleCalendar/events_response.json` - Sample Google Calendar API response
  - [x] `googleCalendar/all_day_events.json` - All-day event examples
  - [x] `focusmate/api_response.json` - Sample Focusmate API response (if available)
  - [x] `focusmate/dom_structure.html` - Sample Focusmate DOM structure

- [x] Create Chrome API mocks in `tests/mocks/chrome-apis.ts`
  - [x] Mock `chrome.identity`
  - [x] Mock `chrome.storage`
  - [x] Mock `chrome.runtime`

### Phase 2 Testing

- [x] **Phase 2 Testing Summary** (`intermediate/phase_2_testing.md`)
  - [x] All utility function unit tests pass
  - [x] Test coverage meets 80% minimum
  - [x] Edge cases handled correctly
  - [x] All-day event conflicts work correctly

### Phase 2 Handoff

- [x] **Phase 2 Handoff** (`intermediate/phase_2_handoff.md`)
  - [x] Document utility function interfaces
  - [x] Document any implementation decisions
  - [x] Document test coverage results

## Phase 3 — Background Service Worker

### Google Calendar Integration

- [x] Implement `src/background/auth.ts`
  - [x] Create `GoogleAuthManager` class
  - [x] Implement `getAuthToken()` using `chrome.identity.getAuthToken()`
  - [x] Implement `refreshToken()` for token refresh
  - [x] Implement `removeCachedToken()` for error recovery
  - [x] Handle OAuth errors and user cancellation

- [x] Implement `src/background/calendar.ts`
  - [x] Create `GoogleCalendarClient` class
  - [x] Implement `fetchEvents()` method
  - [x] Handle API request with proper query parameters (timeMin, timeMax, singleEvents, orderBy)
  - [x] Implement response normalization using `normalizeGCalEvent()`
  - [x] Handle API errors (401, rate limits, network errors)
  - [x] Implement caching with 60-second TTL

- [x] Implement `src/background/focusmate.ts`
  - [x] Create `FocusmateClient` class
  - [x] Implement API-based session fetching (if API available)
  - [x] Implement fallback DOM-based session extraction (if needed)
  - [x] Handle API key validation
  - [x] Handle API errors gracefully

- [x] Implement `src/background/conflict.ts`
  - [x] Create `ConflictComputer` class
  - [x] Use `computeConflicts()` utility function
  - [x] Handle empty sessions/events cases

### Background Service Worker Main

- [x] Implement `src/background/background.ts`
  - [x] Initialize service worker
  - [x] Set up message listeners for content script communication
  - [x] Handle `FETCH_DATA_FOR_RANGE` messages
  - [x] Handle `GET_SETTINGS` messages
  - [x] Coordinate between auth, calendar, focusmate, and conflict modules
  - [x] Implement error handling and logging
  - [x] Load settings from `chrome.storage.local`

### Phase 3 Testing

- [x] **Phase 3 Testing Summary** (`intermediate/phase_3_testing.md`)
  - [x] Test OAuth flow (with mocked chrome.identity)
  - [x] Test Google Calendar API integration (with mocked fetch)
  - [x] Test message passing from content script
  - [x] Test caching behavior
  - [x] Test error handling scenarios

### Phase 3 Handoff

- [x] **Phase 3 Handoff** (`intermediate/phase_3_handoff.md`)
  - [x] Document API integration details
  - [x] Document OAuth flow
  - [x] Document any API limitations discovered
  - [x] Document caching strategy

### Phase 3 Decisions

- [x] **Phase 3 Decisions** (`intermediate/phase_3_decisions.md`)
  - [x] Document OAuth flow implementation
  - [x] Document caching strategy details
  - [x] Document API error handling approach
  - [x] Document multiple account support implementation
  - [x] Document any API limitations discovered

## Phase 4 — Content Script & Overlay UI

### DOM Detection

- [x] Implement `src/content/domDetector.ts`
  - [x] Create `FocusmateDOMDetector` class
  - [x] Implement `detectDateRange()` - extract visible date range from Focusmate UI
  - [x] Implement `extractSessionsFromDOM()` - scrape sessions from DOM
  - [x] Implement `findSessionElements()` - find session DOM elements
  - [x] Implement `getSessionKey()` - extract or generate session key from element
  - [x] Implement multiple selector strategies with fallbacks
  - [x] Handle Focusmate route changes and SPA navigation

### Overlay UI

- [x] Implement `src/content/overlay.ts`
  - [x] Create `CalendarOverlay` class
  - [x] Create Shadow DOM container
  - [x] Implement `render()` - display events in overlay
  - [x] Implement `updateDateRange()` - update displayed range
  - [x] Implement `toggleVisibility()` - show/hide overlay
  - [x] Implement collapse/expand functionality
  - [x] Style overlay with CSS (isolated in Shadow DOM)
  - [x] Add event click handlers to open Google Calendar links
  - [x] Implement `destroy()` for cleanup

### Conflict Styling

- [x] Implement `src/content/conflictStyling.ts`
  - [x] Create `ConflictStyler` class
  - [x] Implement `applyConflicts()` - add CSS classes to conflicting sessions
  - [x] Implement `clearConflicts()` - remove conflict styling
  - [x] Inject CSS styles (via Shadow DOM or document head)
  - [x] Use configurable conflict color from settings
  - [x] Add tooltips or indicators showing conflicting events

### MutationObserver & Lifecycle

- [x] Implement `src/content/content.ts`
  - [x] Initialize content script on Focusmate page load
  - [x] Set up MutationObserver on calendar grid container
  - [x] Debounce MutationObserver callbacks (200ms)
  - [x] Detect Focusmate route changes
  - [x] Request data from background service worker
  - [x] Coordinate overlay rendering and conflict styling
  - [x] Handle settings changes (re-render on settings update)
  - [x] Implement error handling and user feedback

### Phase 4 Testing

- [x] **Phase 4 Testing Summary** (`intermediate/phase_4_testing.md`)
  - [x] Test overlay rendering on Focusmate page
  - [x] Test conflict highlighting
  - [x] Test MutationObserver behavior
  - [x] Test overlay persistence across route changes
  - [x] Test DOM selector strategies
  - [ ] Manual testing in Chrome with real Focusmate page (pending manual test)

### Phase 4 Handoff

- [x] **Phase 4 Handoff** (`intermediate/phase_4_handoff.md`)
  - [x] Document DOM selector strategies used
  - [x] Document any Focusmate DOM structure discoveries
  - [x] Document overlay positioning and styling decisions
  - [x] Document MutationObserver implementation details

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
