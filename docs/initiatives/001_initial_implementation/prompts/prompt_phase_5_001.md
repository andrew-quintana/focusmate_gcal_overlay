# Phase 5 Execution Prompt — Options Page

## Objective
Implement the options page that allows users to configure extension settings, including calendar selection (supporting multiple accounts and calendar groups), conflict color, overlay toggle, and debug logging.

## Context Documents
- @docs/initiatives/001_initial_implementation/scoping/PRD001.md
- @docs/initiatives/001_initial_implementation/scoping/RFC001.md
- @docs/initiatives/001_initial_implementation/scoping/TODO001.md
- @docs/initiatives/001_initial_implementation/scoping/context.md
- @docs/initiatives/001_initial_implementation/intermediate/phase_4_handoff.md

## Phase Scope
This phase implements the options page:
- Settings management (load/save from chrome.storage.local)
- Calendar selection UI (multiple accounts and calendar groups)
- Color picker for conflict highlight
- Toggle switches for overlay and debug logging
- Focusmate API key input (optional)
- Settings validation

## Key Requirements

### Settings Management (`src/options/settingsManager.ts`)
- Implement `SettingsManager` class
- Load settings from `chrome.storage.local`
- Save settings to `chrome.storage.local`
- Get available calendars from Google (support multiple accounts and calendar groups)
- Handle default values
- Validate settings before saving

### Options UI (`src/options/options.ts`)
- Implement `OptionsUI` class
- Render form with current settings
- Bind event handlers for form interactions
- Validate user input (color format, API key format)
- Handle form submission
- Show success/error messages
- Load and display available calendars organized by account and group

### Options HTML (`options.html`)
- Create form structure
- Calendar selection UI (multi-select or checkboxes)
  - **Support multiple Google accounts**
  - **Support calendar groups**
  - Organize calendars by account and group for clarity
- Color picker for conflict color
- Toggle switches for overlay enabled and debug logging
- Input field for Focusmate API key (optional)
- Save/cancel buttons
- Status messages for save feedback

### Options Styling (`styles/options.css`)
- Modern, clean design
- Responsive layout
- Accessible form elements
- Clear labels and instructions
- Organize calendar list by account and group

## Implementation Tasks

Refer to @docs/initiatives/001_initial_implementation/scoping/TODO001.md Phase 5 section for detailed checklist.

## Validation Requirements

1. **Settings Load/Save**: Settings persist correctly in chrome.storage.local
2. **Calendar Selection**: Multiple calendars can be selected across accounts and groups
3. **Input Validation**: Invalid inputs are rejected with clear error messages
4. **Settings Persistence**: Settings persist across browser sessions
5. **Settings Reflection**: Settings changes reflect in content script without reload

## Testing Requirements

- Test settings load and save
- Test calendar selection (multiple accounts and groups)
- Test input validation
- Test settings persistence across browser sessions
- Test settings changes reflect in content script

## Documentation Requirements

After completing this phase, create:

1. **`intermediate/phase_5_decisions.md`**
   - Document UI/UX decisions
   - Document calendar organization approach
   - Document validation rules
   - Document any deviations from RFC

2. **`intermediate/phase_5_testing.md`**
   - Document settings load/save test results
   - Document calendar selection test results
   - Document input validation test results
   - Document settings persistence test results
   - Document settings reflection test results

3. **`intermediate/phase_5_handoff.md`**
   - Document settings schema
   - Document UI/UX decisions
   - Document validation rules
   - Document calendar selection implementation
   - Provide clear instructions for Phase 6

## Checklist Updates

As you complete tasks, update the checkboxes in:
- @docs/initiatives/001_initial_implementation/scoping/TODO001.md Phase 5 section

## Important Notes

- **Multiple Accounts**: Support multiple Google accounts in calendar selection
- **Calendar Groups**: Support calendar groups in addition to individual calendars
- **Default Calendar**: Default to primary calendar of main account
- **UI Organization**: Organize calendars by account and group for clarity
- **Settings Validation**: Validate all user inputs before saving
- **Settings Reflection**: Settings changes should take effect without extension reload

## Success Criteria

- [ ] Settings load and save correctly
- [ ] Calendar selection supports multiple accounts and groups
- [ ] Input validation works correctly
- [ ] Settings persist across browser sessions
- [ ] Settings changes reflect in content script
- [ ] Phase 5 handoff document is complete

