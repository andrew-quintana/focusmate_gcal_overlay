# State of Development — FocusMate Calendar Chrome Extension

## CURRENT PHASE
The project is in **rapid prototyping** mode.  
The goal of this phase is to build a minimal but correct Chrome extension using:

- TypeScript for type safety and better developer experience
- Manifest V3 (latest Chrome extension standard)
- Chrome Storage API (data persistence)
- Chrome Extension APIs (messaging, tabs, storage)
- `@types/chrome` for Chrome Extension API type definitions
- Clean HTML/CSS for UI

This system prioritizes:
1. End-to-end correctness
2. Chrome extension best practices
3. User experience
4. Minimal infrastructure overhead
5. Clear interfaces for future expansion

This phase must remain strictly constrained to ensure completion in a short timeframe.

---

## PRIMARY OBJECTIVES IN THIS PHASE

### 1. Build the Core Extension Structure (Foundational Layer)

The extension must:
- Load successfully in Chrome without errors
- Display a functional popup interface
- Initialize background service worker correctly
- Support basic Chrome Storage operations
- Enable message passing between components

Emphasis = functional correctness, not performance.

### 2. Implement Basic Calendar Integration (Minimal Features)

Extension responsibilities:
- Display calendar information in popup
- Allow user to view/manage calendar events
- Persist user preferences
- Provide basic calendar functionality

No advanced features or complex integrations are allowed in this phase.

### 3. Create Options Page (User Configuration)

Options page must:
- Allow users to configure extension settings
- Persist settings via Chrome Storage API
- Provide clear UI for configuration
- Validate user input

This phase validates whether the extension configuration system is coherent.

### 4. Minimal User Interface

A simple UI layer must:
- Display calendar information clearly
- Provide intuitive user interactions
- Use modern, clean design
- Be responsive and accessible

No complex frameworks or advanced styling allowed.

---

## EXTENSION SCOPE

### Chrome Extension MUST support:
- Popup interface for calendar display
- Background service worker for state management
- Options page for configuration
- Chrome Storage API for data persistence
- Message passing between components
- Basic error handling and user feedback

### Chrome Extension MUST NOT:
- Require complex authentication systems
- Depend on external services (beyond basic APIs)
- Implement advanced offline sync
- Add complexity beyond simple calendar management
- Require complex build tooling

Behavior must remain **lean, explicit, minimal**.

---

## OUT OF SCOPE FOR THIS PHASE (STRICT ENFORCEMENT)
The following are not permitted:

- Multi-account support  
- Advanced calendar integrations (beyond basic functionality)  
- Complex UI frameworks (React, Vue, etc.)  
- Automated sync with external services  
- Advanced authentication  
- Production deployment tooling  
- CI/CD pipelines  
- Any feature not explicitly listed  

If a feature does not support extension functionality, user interface, calendar integration, or extension configuration, it is out of scope.

---

## ENGINEERING PRIORITIES
1. **Correctness:** extension loads and functions without errors  
2. **Reliability:** extension works consistently across Chrome versions  
3. **User Experience:** interface is intuitive and responsive  
4. **Simplicity:** smallest functional system is the correct system  
5. **Maintainability:** code is clear and well-organized  

All code must:
- Follow modular structure (popup, background, content, options)
- Avoid hidden complexity or premature abstraction  
- Maintain consistent code style
- Use simple, transparent interfaces

## LOCAL DEVELOPMENT WORKFLOW

### TypeScript Build Process
- Source TypeScript files are in `src/` directory
- Install dependencies: `npm install`
- Compile TypeScript: `npm run build` (or `npm run watch` for watch mode)
- Compiled JavaScript output goes to `dist/` directory
- Manifest.json references compiled files in `dist/`

### Chrome Extension Development
Local development workflow:
1. **Build TypeScript**: Run `npm run build` (or `npm run watch` for auto-rebuild)
2. **Load Extension**: Open `chrome://extensions/` → Enable Developer mode → Load unpacked → Select project directory
3. **Debug Popup**: Right-click extension icon → Inspect popup
4. **Debug Background**: `chrome://extensions/` → Find extension → Click "Service worker" link
5. **Debug Content Scripts**: Open DevTools on any page where content script runs
6. **Debug Options**: Right-click options page → Inspect

### Testing
- Test in Chrome Developer Mode
- Use Chrome DevTools console for debugging
- Test on different websites for content script functionality
- Verify permissions and storage operations
- Test in incognito mode to verify permissions
- TypeScript type checking: `tsc --noEmit`

---

## VALIDATION GATES (MUST PASS BEFORE MOVING TO NEXT PHASE)

### Extension Structure
- [ ] Extension loads in Chrome without errors
- [ ] Popup opens when clicking extension icon
- [ ] Background service worker initializes correctly
- [ ] Options page is accessible
- [ ] Chrome Storage API operations work
- [ ] Message passing between components works

### Core Functionality
- [ ] Calendar information displays in popup
- [ ] User can interact with calendar interface
- [ ] Settings persist via Chrome Storage
- [ ] Options page saves configuration correctly
- [ ] Error handling provides user feedback

No new features may begin until all gates are satisfied.

---

## META-RULE
If a task or feature does not directly support:
- Extension functionality  
- User interface  
- Calendar integration  
- or extension configuration  

then it must be postponed.

---

**Last Updated**: 2026-01-04

