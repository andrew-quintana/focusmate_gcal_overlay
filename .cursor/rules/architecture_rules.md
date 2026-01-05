# Architecture Rules

## Design Principles

### 1. Modularity
Each component is an independent module with clean interfaces and no cross-layer contamination.

### 2. Minimalism
The project prioritizes correctness and clarity over abstraction. Only the components required for a minimal working version are included.

### 3. TypeScript & Chrome Extension Best Practices
- Use TypeScript for type safety and better developer experience
- Use Manifest V3 (latest standard)
- Follow Chrome extension security guidelines
- Implement proper error handling and user feedback
- Use Chrome Storage API for data persistence
- Follow Chrome extension content security policy
- Use `@types/chrome` for Chrome Extension API type definitions

### 4. Strict Layering
- **Manifest** (`manifest.json`) contains *no business logic*
- **Popup** (`popup.html`/TypeScript) contains *no background processing*
- **Background** (TypeScript) contains *no UI code*
- **Content Scripts** (TypeScript) contain *no extension API calls* (use message passing)
- **Options** (`options.html`/TypeScript) contains *no popup dependencies*

## Layer Boundaries

### Manifest Layer (`manifest.json`)
- Extension configuration only
- Permissions declaration
- No business logic
- Defines entry points for popup, background, content scripts, and options

### Popup Layer (`popup.html`, `src/popup.ts`, `styles/popup.css`)
- User interface for extension popup
- TypeScript source code compiled to `dist/popup.js`
- Communicates with background via `chrome.runtime.sendMessage`
- Uses Chrome Storage API for reading/writing data
- No direct content script manipulation

### Background Layer (`src/background.ts`)
- TypeScript source code compiled to `dist/background.js`
- Service worker for background tasks
- Handles extension lifecycle events
- Processes messages from popup and content scripts
- Manages extension state and storage
- No UI code

### Content Script Layer (`src/content.ts`)
- TypeScript source code compiled to `dist/content.js`
- Runs in the context of web pages
- Can read and modify DOM
- Communicates with background via `chrome.runtime.sendMessage`
- No direct access to extension APIs (except messaging)

### Options Layer (`options.html`, `src/options.ts`, `styles/options.css`)
- TypeScript source code compiled to `dist/options.js`
- Extension settings page
- User configuration interface
- Uses Chrome Storage API for settings persistence
- No popup dependencies

## Development Workflow

### TypeScript Build Process
- Source TypeScript files are in `src/` directory
- Compile TypeScript: `npm run build` (or `npm run watch` for watch mode)
- Compiled JavaScript output goes to `dist/` directory
- Manifest.json references compiled files in `dist/`

### Local Development
1. Install dependencies: `npm install`
2. Build TypeScript: `npm run build` (or `npm run watch` for auto-rebuild)
3. Load unpacked extension in Chrome: `chrome://extensions/` → Developer mode → Load unpacked
4. Use Chrome DevTools for debugging:
   - Popup: Right-click extension icon → Inspect popup
   - Background: `chrome://extensions/` → Service worker link
   - Content Scripts: Regular page DevTools
   - Options: Right-click options page → Inspect

### Testing
- Test in Chrome Developer Mode
- Use Chrome DevTools console for debugging
- Test on different websites for content script functionality
- Verify permissions and storage operations
- TypeScript type checking: `tsc --noEmit`

### Build & Distribution
- Build TypeScript: `npm run build`
- Package extension as `.zip` for Chrome Web Store (include `dist/` directory)
- Ensure all required icons are present
- Test in incognito mode to verify permissions
- Validate manifest.json before submission

