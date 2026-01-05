# FocusMate Calendar Extension — Codebase Scoping Document

## Purpose of This Document
This document defines the **initial codebase structure**, **module boundaries**, **interfaces**, **environment layout**, and **scaffolding requirements** for the FocusMate Calendar Chrome Extension.

It is written to enforce:
- a modular Chrome extension architecture,
- clean separation between popup, background, content scripts, and options,
- strict adherence to Manifest V3 standards,
- and a maintainable architecture that supports rapid development.

This scoping document must be completed **before** implementation begins and serves as the source of truth for PRD, RFC, and TODO development.

---

## High-Level System Overview

The FocusMate Calendar Chrome Extension consists of four main components:

1. **Popup Interface**  
   User-facing popup that appears when clicking the extension icon. Handles user interactions and displays calendar information.

2. **Background Service Worker**  
   Handles extension lifecycle, manages state, processes messages, and coordinates between components.

3. **Content Scripts**  
   Optional scripts that can interact with web pages to extract or inject calendar-related information.

4. **Options Page**  
   Settings and configuration interface for the extension.

Each component must be isolated but consistent, sharing data through Chrome Storage API and message passing.

---

## Design Principles

### **1. Modularity**
Each component is an independent module with clean interfaces and no cross-layer contamination.

### **2. Minimalism**
The project prioritizes correctness and clarity over abstraction.  
Only the components required for a minimal working version are included.

### **3. TypeScript & Chrome Extension Standards**
- Use TypeScript for type safety and better developer experience
- Follow Manifest V3 specifications
- Use Chrome Storage API for persistence
- Implement proper message passing between components
- Adhere to Content Security Policy requirements
- Use `@types/chrome` for Chrome Extension API type definitions

### **4. Strict Layering**
- Manifest contains *no business logic*.  
- Popup contains *no background processing*.  
- Background contains *no UI code*.  
- Content scripts contain *no direct extension API calls* (use message passing).

---

## Development Phase
This phase is **rapid prototyping**, focusing on:
- correctness,
- Chrome extension best practices,
- minimal API surface area,
- fast iteration,
- and simple development workflow.

Out-of-scope features (complex UI frameworks, advanced authentication, multi-account support, offline sync) must not be implemented during this phase.

---

## Codebase Structure

```
focusmate_cal/
│
├── manifest.json              # Extension manifest (Manifest V3)
├── package.json               # npm dependencies and scripts
├── tsconfig.json              # TypeScript configuration
│
├── src/                       # TypeScript source files
│   ├── popup.ts               # Popup TypeScript logic
│   ├── background.ts          # Background service worker
│   ├── content.ts             # Content script
│   └── options.ts             # Options page TypeScript
│
├── dist/                      # Compiled JavaScript (generated)
│   ├── popup.js               # Compiled popup script
│   ├── background.js          # Compiled background script
│   ├── content.js             # Compiled content script
│   └── options.js             # Compiled options script
│
├── popup.html                 # Popup interface HTML
├── options.html               # Options page HTML
│
├── styles/
│   ├── popup.css              # Popup styles
│   └── options.css            # Options page styles
│
├── icons/
│   ├── icon16.png             # 16x16 icon
│   ├── icon48.png             # 48x48 icon
│   └── icon128.png            # 128x128 icon
│
├── .cursor/
│   ├── rules/
│   │   ├── scoping_document.md
│   │   ├── architecture_rules.md
│   │   ├── state_of_development.md
│   │   └── date_handling.md
│   ├── agents/
│   │   └── documentation-agent.json
│   └── config.json
│
└── .gitignore                 # Git ignore file

```

---

## Component Architecture Breakdown

### **1. Manifest (`manifest.json`)**

Contains:
- Extension metadata (name, version, description)
- Permissions declaration
- Entry point definitions (popup, background, content scripts, options)
- Icon references

No business logic belongs here.

### **2. Popup (`popup.html`, `src/popup.ts`, `styles/popup.css`)**

Contains:
- User interface for extension popup
- TypeScript source code compiled to `dist/popup.js`
- User interaction handlers
- Communication with background via `chrome.runtime.sendMessage`
- Reading/writing data via Chrome Storage API

No background processing or content script manipulation.

### **3. Background Service Worker (`src/background.ts`)**

Contains:
- TypeScript source code compiled to `dist/background.js`
- Extension lifecycle event handlers (`chrome.runtime.onInstalled`)
- Message routing between popup and content scripts
- State management
- Chrome Storage API operations
- Background task coordination

No UI code.

### **4. Content Script (`src/content.ts`)**

Contains:
- TypeScript source code compiled to `dist/content.js`
- DOM reading and manipulation
- Web page interaction logic
- Communication with background via `chrome.runtime.sendMessage`

No direct extension API calls (except messaging).

### **5. Options Page (`options.html`, `src/options.ts`, `styles/options.css`)**

Contains:
- TypeScript source code compiled to `dist/options.js`
- Extension settings interface
- User configuration handlers
- Settings persistence via Chrome Storage API

No popup dependencies.

---

## Data Storage

### Chrome Storage API
- Use `chrome.storage.local` for extension data
- Use `chrome.storage.sync` for cross-device sync (if needed)
- Implement proper error handling for storage operations

### Storage Schema
Define clear data structures for:
- Calendar events
- User preferences
- Extension state

---

## Communication Patterns

### Message Passing
- Popup → Background: `chrome.runtime.sendMessage`
- Content Script → Background: `chrome.runtime.sendMessage`
- Background → Popup/Content: `chrome.runtime.sendMessage` or `chrome.tabs.sendMessage`

### Storage Access
- All components can read/write to Chrome Storage
- Use consistent key naming conventions
- Implement data validation

---

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
4. Use Chrome DevTools for debugging
5. Test on different websites for content script functionality

### Testing
- Test in Chrome Developer Mode
- Use Chrome DevTools console for debugging
- Verify permissions and storage operations
- Test in incognito mode
- TypeScript type checking: `tsc --noEmit`

---

## Required Scaffolding Before Implementation

### ✔ Manifest.json created with Manifest V3 structure

### ✔ TypeScript configuration created (tsconfig.json, package.json)

### ✔ Popup interface files created (HTML, TypeScript, CSS)

### ✔ Background service worker created (TypeScript)

### ✔ Content script created (TypeScript)

### ✔ Options page created (HTML, TypeScript, CSS)

### ✔ Icons directory created (with placeholder)

### ✔ Directory structure established

### ✔ Cursor rules and design docs in `.cursor/rules/`

---

## Success Criteria for Codebase Setup

1. Extension loads in Chrome without errors.
2. Popup opens when clicking extension icon.
3. Background service worker initializes correctly.
4. Content script can be injected (if needed).
5. Options page is accessible.
6. Chrome Storage API operations work.
7. Message passing between components works.

When these criteria are met, functional implementation may begin.

---

## Meta-Rule

If a feature or file does not directly support:
- Extension functionality,
- User interface,
- Calendar integration,
- or extension configuration,

it must be postponed to a later phase.

