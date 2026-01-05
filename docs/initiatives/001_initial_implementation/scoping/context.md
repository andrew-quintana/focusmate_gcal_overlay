# Focusmate Calendar Overlay — Context

## Goal
Build a Chrome extension (Manifest V3) that overlays a user's Google Calendar events on the Focusmate web app, and visually highlights Focusmate sessions that overlap (time-conflict) with Google Calendar events.

Primary UX outcomes:
- When the user opens Focusmate (web), they see an on-page overlay of their calendar (agenda or mini-timeline).
- If a calendar event overlaps a Focusmate session, that Focusmate session is recolored (configurable).
- Extension runs locally; no external server.

## Non-goals
- Editing Google Calendar events (read-only).
- Modifying Focusmate session times.
- Creating Focusmate sessions automatically.
- Perfect long-term stability across arbitrary Focusmate DOM changes (we'll make it robust, but this is a web-overlay by definition).
- Supporting Firefox/Safari (Chrome first).

## Assumptions / Constraints
- Focusmate is a SPA; the calendar/session UI updates dynamically and may re-render on route changes.
- We will highlight conflicts visually on the Focusmate page by injecting CSS + DOM overlay.
- Focusmate sessions can be acquired either:
  - Preferred: via Focusmate public API (requires API key stored in extension options).
  - Fallback: via DOM scraping session blocks (if API endpoints don't provide what we need).
- Google Calendar data acquired via OAuth using `chrome.identity` (MV3).
- Time zones must be handled carefully; all overlap comparisons must be done with normalized timestamps.
- **All implementation must be in TypeScript** - source code in `.ts` files, compiled to JavaScript for Chrome extension runtime.

## Deliverables
- Chrome extension codebase with TypeScript source files:
  - `manifest.json` (MV3)
  - `src/background/background.ts` (service worker)
  - `src/content/content.ts` (injection + overlay rendering + conflict styling)
  - `src/options/options.ts`, `options.html` (config)
  - `src/types/` (TypeScript type definitions)
  - `src/utils/` (utility functions)
  - Build configuration for TypeScript compilation
- A working MVP that:
  - Auths to Google Calendar (readonly)
  - Fetches events in a date range
  - Determines overlap with Focusmate sessions
  - Displays overlay and highlights conflicting sessions
  - Lets user configure:
    - calendars included (at least primary, optional list)
    - conflict highlight color
    - overlay on/off
    - Focusmate API key (if using API approach)

## Target Pages
- `https://app.focusmate.com/*`
(Exact Focusmate routes may vary. Treat as SPA and detect view state from DOM.)

## Architecture Overview
### Components
1) Background Service Worker (`src/background/background.ts`)
- Responsibilities:
  - Google OAuth token management (`chrome.identity.getAuthToken`)
  - Fetch Google Calendar events via `googleapis.com/calendar/v3/...`
  - Fetch Focusmate sessions (API) OR accept parsed sessions from content script (DOM)
  - Compute overlaps (or compute in content script; choose one and keep consistent)
  - Respond to messages from content script with:
    - events in range
    - conflicts mapping
    - debug info (optional, behind flag)

2) Content Script (`src/content/content.ts`)
- Responsibilities:
  - Detect Focusmate UI readiness and route changes
  - Extract visible date range / currently shown day/week (best-effort)
  - Create overlay UI (Shadow DOM strongly recommended)
  - Request data from background (events + session conflicts)
  - Apply conflict styling to Focusmate session DOM elements
  - Use `MutationObserver` to reapply on re-render

3) Options Page (`src/options/options.ts` + `options.html`)
- Responsibilities:
  - Store/retrieve user settings in `chrome.storage.local`
  - Trigger "Sign in with Google" (or rely on first interactive token request from background)
  - Store:
    - `focusmateApiKey` (string, optional)
    - `overlayEnabled` (bool)
    - `conflictColor` (string CSS color)
    - `calendarIds` (string[] optional, default: ["primary"] - supports multiple accounts and calendar groups)
    - `debugLogging` (bool)
  - Support multiple Google accounts and calendar groups in calendar selection UI

### Data Flow
- Content script determines a time window (e.g., today 00:00 → today 23:59, or the visible week).
- Content script sends message to background: `FETCH_DATA_FOR_RANGE`.
- Background:
  - ensures Google token
  - fetches events for calendarIds
  - fetches Focusmate sessions for same range (if API approach) OR accepts sessions from content script (DOM approach)
  - computes overlaps
  - returns:
    - events[]
    - sessions[]
    - conflicts: map(sessionKey -> eventIds[])
- Content:
  - renders overlay using events[]
  - finds session blocks in Focusmate DOM and applies class if conflicts[sessionKey] is non-empty

## Implementation Approach (MVP)
### Step 1 — Extension Scaffolding (TypeScript)
Create:
- `manifest.json`
- `tsconfig.json` (TypeScript configuration)
- Build configuration (webpack/rollup)
- `src/background/background.ts`
- `src/content/content.ts`
- `src/options/options.ts`
- `options.html`

Manifest requirements:
- MV3
- Permissions:
  - `identity` (Google OAuth)
  - `storage`
  - `scripting` (optional, but content_scripts can handle injection)
- Host permissions:
  - `https://app.focusmate.com/*`
  - `https://www.googleapis.com/*`

### Step 2 — Google Calendar Auth + Fetch
Background:
- Use `chrome.identity.getAuthToken({ interactive: true })`
- For each selected calendarId, call:
  - `GET https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events`
  - query params:
    - `timeMin`, `timeMax` (ISO strings)
    - `singleEvents=true` (expand recurring)
    - `orderBy=startTime`
    - `maxResults=2500` (safe cap; if paging required, implement paging)
- Normalize events into TypeScript interface:
```typescript
interface GCalEvent {
  id: string;
  calendarId: string;
  summary?: string;
  startMs: number; // epoch ms
  endMs: number;   // epoch ms
  allDay: boolean;
  htmlLink?: string;
}
```

Notes:
- Handle all-day events: they often come with `date` (not `dateTime`) and should be treated as local-day blocks.
- Exclude cancelled events.

### Step 3 — Focusmate Sessions Source
**Primary path (Google Calendar - when sync enabled):**
- If user has Focusmate→Google Calendar sync enabled, Focusmate sessions appear as Google Calendar events.
- Use Google Calendar API as primary source of truth for session data and time ranges.
- This is the most reliable path for time-window alignment.

**Optional path (Focusmate API):**
- Options page stores `focusmateApiKey`.
- Background fetches sessions using Focusmate public API (user-scoped, not fully productized).
- **Important**: Focusmate API does not guarantee explicit date-range querying. Date filtering may be coarse or implicit.
- Normalize to TypeScript interface:
```typescript
interface FocusmateSession {
  id: string;
  startMs: number;
  endMs: number;
  title?: string;
  raw?: unknown;
}
```

**Fallback path (DOM scraping):**
- Content script scrapes session blocks from Focusmate calendar UI.
- **Critical**: Focusmate DOM has no stable identifiers. Use derived keys from time ranges.
- It extracts:
  - start/end times (from text parsing; no reliable session IDs in DOM)
  - session key derived from: `${startMs}-${endMs}-${labelHash}` (if title available)
- Sends sessions to background with the range request.

**Design principle**: Treat Focusmate API as optional, not foundational. Prefer Google Calendar as source of truth, especially when sync is enabled.

### Step 4 — Overlap Detection
Define overlap as:
- Two intervals `[aStart, aEnd)` and `[bStart, bEnd)` overlap iff:
  - `aStart < bEnd && aEnd > bStart`

Compute TypeScript type:
```typescript
type ConflictMap = Record<string, string[]>;
// sessionKey -> eventIds[]
```

Define sessionKey:
- **No stable DOM IDs available** - Focusmate is React-based SPA with hashed class names.
- Always derive session key from observable attributes: `${startMs}-${endMs}-${labelHash}` (if title/label available).
- Use derived keys consistently between "compute overlaps" and "apply CSS".
- Multiple selector strategies needed: accessibility labels, time text parsing, derived keys.

### Step 5 — Overlay UI in Focusmate
Content script:
- Create a container pinned to right side (or bottom) of the page.
- Use Shadow DOM to isolate styles.
- Render events in the chosen time window:
  - Minimal agenda list:
    - time range
    - event title
    - calendar color indicator (optional)
  - Optional: clickable `htmlLink` to open in new tab

Overlay requirements:
- Must not block core Focusmate interactions; use:
  - a collapse/expand button
  - `pointer-events` carefully (container interactive, but keep it compact)
- Should persist across SPA route changes (recreate if DOM removed).

### Step 6 — Conflict Styling on Focusmate Sessions
Content script:
- Find session DOM elements.
- Add a CSS class e.g. `.fmcal-conflict`.
- Inject CSS (either into Shadow root targeting via :host + global injection, or a `<style>` in document head):
  - set background color / border color / outline
  - optional: add an icon/badge
- Use `MutationObserver` to reapply:
  - observing the calendar grid container
  - debounce updates (e.g., 200ms) to avoid thrash

This is the riskiest part because Focusmate DOM can change.
Mitigation:
- Implement multiple selectors and heuristics:
  - by accessible labels
  - by stable data attributes
  - by time text parsing
- Maintain a "selector strategy list" and log which one matched when debug enabled.

## Messaging Protocol
Define message types in TypeScript:

From content -> background:
```typescript
interface FetchDataForRangeMessage {
  type: "FETCH_DATA_FOR_RANGE";
  range: { startMs: number; endMs: number };
  timezone?: string;
  visibleView?: "day" | "week" | "unknown";
  sessionsFromDom?: FocusmateSession[]; // only if DOM approach
}
```

From background -> content:
```typescript
interface RangeDataResponse {
  ok: boolean;
  error?: string;
  events?: GCalEvent[];
  sessions?: FocusmateSession[];
  conflicts?: ConflictMap;
}
```

Also add:
- `GET_SETTINGS`
- `SET_SETTINGS` (optional; mostly use storage directly from options)

## Storage Keys
Use `chrome.storage.local`:
- `overlayEnabled: boolean` (default true)
- `conflictColor: string` (default "#ff6b6b" or any CSS color string)
- `calendarIds: string[]` (default ["primary"])
- `focusmateApiKey: string | null`
- `debugLogging: boolean` (default false)

## UX Details
- Overlay has:
  - Title: "Calendar"
  - Range indicator (Today / This Week)
  - List of events sorted by start time
  - Optional filter: hide all-day events
  - Toggle: "Highlight conflicts" (on by default)
- Conflict highlight:
  - Change Focusmate session background and add border
  - Optional tooltip: "Conflicts with: Event A, Event B"

## Edge Cases
- All-day events: treat as covering the full day in local time; they will overlap any session on that day.
- Recurring events: use `singleEvents=true` so overlaps are straightforward.
- Events without end time (rare): treat as +30 minutes default or skip with log.
- Timezone mismatch:
  - Use epoch ms for comparisons
  - Parse Google `dateTime` with offset
  - For `date` (all-day) interpret as local midnight boundaries
- Token expiration:
  - On 401 from Google API, call `chrome.identity.removeCachedAuthToken` and retry once.
- Rate limits:
  - Cache results per range for short time (e.g., 60s) in background memory.
- Focusmate DOM changes:
  - Expect breakage; keep selectors centralized and easy to update.

## Security / Privacy Notes
- No server.
- Tokens are stored/managed by Chrome Identity; Focusmate API key stored locally.
- Do not log raw event details unless debug enabled.
- Never exfiltrate calendar data.

## Testing Strategy
### Manual tests (MVP)
1. Install unpacked extension.
2. Open Focusmate app page.
3. Confirm overlay appears.
4. Confirm Google auth prompt appears on first fetch.
5. Create a Google Calendar event overlapping a known Focusmate session time.
6. Reload Focusmate page and verify session highlight changes.
7. Change conflict color in options and verify update.
8. Toggle overlay off and verify removal.
9. Navigate within Focusmate SPA and confirm overlay persists and re-styles.

### Automated tests (lightweight)
- Pure functions:
  - overlap detection
  - event normalization
  - session normalization (API response parsing)
  Can be run with a minimal test harness (optional for MVP).

## Acceptance Criteria
- Overlay renders on Focusmate pages reliably after load and after SPA navigation.
- Google Calendar events are fetched for the visible range (day or week).
- Overlap computation correctly identifies conflicts (basic interval logic).
- Conflicting Focusmate sessions are recolored according to user setting.
- Options page works: stores/retrieves settings; changes take effect without reinstalling.
- No console spam in normal mode; debug logs only when enabled.
- All source code is TypeScript with proper type definitions.

## Implementation Notes / Agent Instructions
- Implement "day view" first:
  - Range = local today 00:00 → tomorrow 00:00
  - Later extend to week view if easy to detect from Focusmate UI.
- Centralize DOM selector logic in one module section in `content.ts`.
- Use Shadow DOM for overlay styling isolation.
- Add debounce around MutationObserver callbacks.
- Keep code readable; prioritize robustness over micro-optimizations.
- Include a `DEBUG` flag from storage; gate all verbose logs behind it.
- **All implementation must be in TypeScript** - ensure proper type definitions for all data structures and API responses.

## Resolved Questions

### Focusmate API Availability ✅
- **Answer**: Focusmate provides a public, user-scoped API, but it is not fully productized. Explicit date-range querying is not guaranteed.
- **Critical Insight**: When Focusmate→Google Calendar sync is enabled, sessions appear as Google Calendar events. **Prefer Google Calendar as primary source of truth** for session data and time ranges.
- **Design**: Treat Focusmate API as optional fallback only.

### Focusmate Session DOM Structure ✅
- **Answer**: No stable DOM identifiers exist. Focusmate is React-based SPA with hashed class names. Data attributes are not reliable.
- **Design**: Always use derived keys from time ranges: `${startMs}-${endMs}-${labelHash}`. Implement multiple selector strategies (accessibility labels, time text parsing, derived keys).

### Calendar Selection ✅
- **Answer**: Support multiple Google accounts and calendar groups. Default to primary calendar of main account.
- **Design**: Options page UI should organize calendars by account and group for clarity.

(Agent should use these resolved findings during implementation. DOM selectors should use multiple strategies with derived keys as fallback.)
