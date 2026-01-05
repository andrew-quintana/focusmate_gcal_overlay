# Phase 5 Decisions

## Overview

Phase 5 implements the options page that allows users to configure extension settings, including calendar selection, conflict color, overlay toggle, and debug logging.

## UI/UX Decisions

### 1. Form Layout and Organization

**Decision**: Organize settings into logical sections with clear headers and descriptions.

**Rationale**: 
- Grouping related settings improves usability and reduces cognitive load
- Clear section headers help users understand what each setting does
- Descriptive help text provides context without cluttering the UI

**Implementation**:
- Overlay Settings section for overlay toggle
- Calendar Selection section for calendar multi-select
- Conflict Highlighting section for color picker
- Focusmate API section for optional API key
- Debug Settings section for debug logging toggle

### 2. Calendar Selection UI

**Decision**: Use checkboxes organized by account and group, with hierarchical structure.

**Rationale**:
- Checkboxes provide clear visual feedback for multi-select
- Hierarchical organization (account → group → calendar) helps users navigate multiple accounts and groups
- Grouping reduces visual clutter when many calendars are available

**Implementation**:
- Calendars grouped by account (account header)
- Within each account, calendars grouped by group (group header)
- Ungrouped calendars shown under "Calendars" header
- Checkboxes with labels for each calendar
- Scrollable container for long lists

### 3. Color Picker Implementation

**Decision**: Provide both color picker (visual) and text input (precise) for conflict color.

**Rationale**:
- Color picker provides intuitive visual selection
- Text input allows precise hex color entry and CSS color names
- Syncing both inputs provides flexibility for different user preferences

**Implementation**:
- HTML5 color input for visual selection
- Text input for hex/CSS color entry
- Real-time synchronization between inputs
- Validation for hex format (#rrggbb or #rgb) and CSS color names

### 4. Settings Validation

**Decision**: Validate settings on save with clear error messages.

**Rationale**:
- Prevents invalid settings from being saved
- Clear error messages help users fix issues quickly
- Validation ensures extension continues to work correctly

**Implementation**:
- Color format validation (hex or CSS color names)
- At least one calendar must be selected
- API key format validation (optional, string or null)
- Error messages displayed in status area

### 5. Status Messages

**Decision**: Show success/error messages in a dedicated status area above action buttons.

**Rationale**:
- Provides immediate feedback on user actions
- Clear visual distinction between success and error states
- Non-intrusive placement that doesn't block form interaction

**Implementation**:
- Status message element with success/error classes
- Green background for success, red for errors
- Auto-dismiss after 3 seconds for success messages
- Manual dismiss for errors (via cancel or new action)

### 6. Loading States

**Decision**: Show loading indicator during async operations (loading calendars, saving settings).

**Rationale**:
- Provides feedback during potentially slow operations
- Prevents duplicate submissions
- Improves perceived performance

**Implementation**:
- Loading indicator in calendar list area
- Disable save/cancel buttons during loading
- Show loading text: "Loading calendars..."

## Calendar Organization Approach

### Account and Group Support

**Decision**: Support multiple Google accounts and calendar groups, organizing calendars hierarchically.

**Rationale**:
- Users may have multiple Google accounts with calendars
- Calendars may be organized in groups within accounts
- Hierarchical organization improves discoverability

**Implementation**:
- Fetch calendars from Google Calendar API
- Group calendars by account (accountId or accountName)
- Within each account, group calendars by group (groupId or groupName)
- Display account headers and group headers
- Show "Default Account" if account info not available
- Show "Calendars" for ungrouped calendars

### Calendar List Rendering

**Decision**: Render calendars in a scrollable container with account/group headers.

**Rationale**:
- Scrollable container handles large numbers of calendars
- Headers provide clear organization
- Checkboxes allow easy multi-select

**Implementation**:
- Max height: 400px (300px on mobile)
- Custom scrollbar styling for better UX
- Account sections with headers
- Group sections within accounts (if multiple groups)
- Checkbox containers with hover effects

## Validation Rules

### Color Validation

**Rule**: Conflict color must be valid hex format (#rrggbb or #rgb) or CSS color name.

**Implementation**:
- Regex check for hex format: `/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/`
- CSS color name check: Set color on Option element style and check if it's valid
- Error message: "Invalid color format. Use hex (#rrggbb) or CSS color names."

### Calendar Selection Validation

**Rule**: At least one calendar must be selected.

**Implementation**:
- Check selected calendar count
- Error message: "Please select at least one calendar."

### API Key Validation

**Rule**: API key must be a string or null (empty string converted to null).

**Implementation**:
- Type check: must be string
- Empty string trimmed and converted to null
- No format validation (Focusmate API key format not documented)

## Settings Persistence

### Storage Strategy

**Decision**: Use `chrome.storage.local` for all settings with individual keys.

**Rationale**:
- Chrome storage API provides persistence across sessions
- Individual keys allow partial updates
- Local storage is appropriate for user preferences

**Implementation**:
- Each setting stored with its own key from `STORAGE_KEYS`
- Partial updates supported (only changed settings saved)
- Default values applied if setting not found

### Real-time Updates

**Decision**: Content script listens to storage changes for real-time updates.

**Rationale**:
- Settings changes take effect immediately without page reload
- Better user experience than requiring extension reload

**Implementation**:
- Content script uses `chrome.storage.onChanged` listener
- Background service worker also listens for changes
- Settings updates trigger appropriate actions (overlay toggle, color update, etc.)

## Error Handling

### Calendar Loading Errors

**Decision**: Show error message but continue with settings if calendar loading fails.

**Rationale**:
- User can still configure other settings if calendar API fails
- Error message guides user to sign in if needed

**Implementation**:
- Try-catch around calendar loading
- Show error: "Failed to load calendars. Please ensure you are signed in to Google."
- Continue with settings load even if calendars fail

### Save Errors

**Decision**: Show error message in status area, keep form state.

**Rationale**:
- User can see what went wrong and retry
- Form state preserved so user doesn't lose changes

**Implementation**:
- Try-catch around save operation
- Show error message with details
- Form remains editable for retry

## Accessibility Considerations

### Form Labels

**Decision**: Use proper label associations and ARIA attributes.

**Rationale**:
- Screen readers can properly identify form controls
- Improves accessibility for users with disabilities

**Implementation**:
- `<label>` elements with `for` attributes
- `aria-label` for calendar list group
- Semantic HTML structure

### Keyboard Navigation

**Decision**: Ensure all form controls are keyboard accessible.

**Rationale**:
- Users should be able to navigate and interact without mouse
- Standard keyboard navigation patterns expected

**Implementation**:
- All inputs and buttons are focusable
- Tab order follows visual layout
- Enter key submits form (via save button)

## Deviations from RFC

### None

All implementation follows the RFC001.md specifications for Phase 5.

## Future Considerations

### Calendar Search/Filter

**Future Enhancement**: Add search/filter functionality for calendar list when many calendars are available.

### Calendar Groups UI

**Future Enhancement**: If Google Calendar API provides more detailed group information, enhance group display with icons or colors.

### Settings Import/Export

**Future Enhancement**: Allow users to export/import settings for backup or sharing.

### Settings Validation Improvements

**Future Enhancement**: Add more sophisticated validation (e.g., API key format validation if Focusmate documents format).

