/**
 * Options page script for Chrome extension
 * Handles user configuration and settings management
 */

import type { ExtensionSettings } from '../types/storage';
import type { CalendarInfo } from './settingsManager';
import { SettingsManager } from './settingsManager';

/**
 * OptionsUI manages the options page UI and interactions
 */
class OptionsUI {
  private settingsManager: SettingsManager;
  private currentSettings: ExtensionSettings | null = null;
  private availableCalendars: CalendarInfo[] = [];

  // Form elements
  private overlayEnabledInput!: HTMLInputElement;
  private conflictColorInput!: HTMLInputElement;
  private conflictColorTextInput!: HTMLInputElement;
  private calendarListContainer!: HTMLElement;
  private debugLoggingInput!: HTMLInputElement;
  private saveButton!: HTMLButtonElement;
  private cancelButton!: HTMLButtonElement;
  private statusMessage!: HTMLElement;
  private loadingIndicator!: HTMLElement;

  constructor() {
    this.settingsManager = new SettingsManager();
  }

  /**
   * Initializes the options page UI
   */
  async initialize(): Promise<void> {
    // Get form elements
    this.overlayEnabledInput = document.getElementById('overlayEnabled') as HTMLInputElement;
    this.conflictColorInput = document.getElementById('conflictColor') as HTMLInputElement;
    this.conflictColorTextInput = document.getElementById('conflictColorText') as HTMLInputElement;
    this.calendarListContainer = document.getElementById('calendarList') as HTMLElement;
    this.debugLoggingInput = document.getElementById('debugLogging') as HTMLInputElement;
    this.saveButton = document.getElementById('saveButton') as HTMLButtonElement;
    this.cancelButton = document.getElementById('cancelButton') as HTMLButtonElement;
    this.statusMessage = document.getElementById('statusMessage') as HTMLElement;
    this.loadingIndicator = document.getElementById('loadingIndicator') as HTMLElement;

    // Bind event handlers
    this.bindEventHandlers();

    // Load settings and calendars
    await this.loadData();
  }

  /**
   * Loads settings and available calendars
   */
  private async loadData(): Promise<void> {
    try {
      this.showLoading(true);

      // Load settings
      this.currentSettings = await this.settingsManager.loadSettings();

      // Load available calendars
      try {
        this.availableCalendars = await this.settingsManager.getAvailableCalendars();
      } catch (error) {
        console.error('Failed to load calendars:', error);
        this.showError('Failed to load calendars. Please ensure you are signed in to Google.');
        // Continue with settings even if calendars fail
      }

      // Render form
      this.render();

      this.showLoading(false);
    } catch (error) {
      this.showLoading(false);
      this.showError(`Failed to load settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Renders the form with current settings
   */
  private render(): void {
    if (!this.currentSettings) {
      return;
    }

    // Set form values
    this.overlayEnabledInput.checked = this.currentSettings.overlayEnabled;
    this.conflictColorInput.value = this.currentSettings.conflictColor;
    this.conflictColorTextInput.value = this.currentSettings.conflictColor;
    this.debugLoggingInput.checked = this.currentSettings.debugLogging;

    // Render calendar list
    this.renderCalendarList();
  }

  /**
   * Renders the calendar selection list
   * Organizes calendars by account and group
   */
  private renderCalendarList(): void {
    if (!this.currentSettings) {
      return;
    }

    this.calendarListContainer.innerHTML = '';

    if (this.availableCalendars.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No calendars available. Please sign in to Google.';
      this.calendarListContainer.appendChild(emptyMessage);
      return;
    }

    // Group calendars by account and group
    const groupedCalendars = this.groupCalendars(this.availableCalendars);

    // Render grouped calendars
    for (const [accountKey, groups] of Object.entries(groupedCalendars)) {
      const accountSection = document.createElement('div');
      accountSection.className = 'calendar-account-section';

      // Account header
      const accountHeader = document.createElement('h3');
      accountHeader.className = 'calendar-account-header';
      accountHeader.textContent = this.getAccountDisplayName(accountKey);
      accountSection.appendChild(accountHeader);

      // Groups within account
      for (const [groupKey, calendars] of Object.entries(groups)) {
        if (groupKey !== 'ungrouped' || Object.keys(groups).length === 1) {
          // Only show group header if there are multiple groups
          if (Object.keys(groups).length > 1) {
            const groupHeader = document.createElement('h4');
            groupHeader.className = 'calendar-group-header';
            groupHeader.textContent = this.getGroupDisplayName(groupKey);
            accountSection.appendChild(groupHeader);
          }

          // Calendar checkboxes
          for (const calendar of calendars) {
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'calendar-checkbox-container';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `calendar-${calendar.id}`;
            checkbox.value = calendar.id;
            checkbox.checked = this.currentSettings.calendarIds.includes(calendar.id);

            const label = document.createElement('label');
            label.htmlFor = `calendar-${calendar.id}`;
            label.textContent = calendar.summary;

            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            accountSection.appendChild(checkboxContainer);
          }
        }
      }

      this.calendarListContainer.appendChild(accountSection);
    }
  }

  /**
   * Groups calendars by account and group
   */
  private groupCalendars(calendars: CalendarInfo[]): Record<string, Record<string, CalendarInfo[]>> {
    const grouped: Record<string, Record<string, CalendarInfo[]>> = {};

    for (const calendar of calendars) {
      const accountKey = calendar.accountId || calendar.accountName || 'default';
      const groupKey = calendar.groupId || calendar.groupName || 'ungrouped';

      if (!grouped[accountKey]) {
        grouped[accountKey] = {};
      }

      if (!grouped[accountKey][groupKey]) {
        grouped[accountKey][groupKey] = [];
      }

      grouped[accountKey][groupKey].push(calendar);
    }

    return grouped;
  }

  /**
   * Gets display name for account
   */
  private getAccountDisplayName(accountKey: string): string {
    const calendar = this.availableCalendars.find(
      c => (c.accountId || c.accountName || 'default') === accountKey
    );
    return calendar?.accountName || calendar?.accountId || accountKey || 'Default Account';
  }

  /**
   * Gets display name for group
   */
  private getGroupDisplayName(groupKey: string): string {
    if (groupKey === 'ungrouped') {
      return 'Calendars';
    }
    const calendar = this.availableCalendars.find(
      c => (c.groupId || c.groupName || 'ungrouped') === groupKey
    );
    return calendar?.groupName || calendar?.groupId || groupKey;
  }

  /**
   * Binds event handlers to form elements
   */
  private bindEventHandlers(): void {
    this.saveButton.addEventListener('click', () => this.handleSave());
    this.cancelButton.addEventListener('click', () => this.handleCancel());
  }

  /**
   * Handles form submission
   */
  private async handleSave(): Promise<void> {
    try {
      // Validate input
      if (!this.validateInput()) {
        return;
      }

      // Collect form values
      // Use text input value if it's a valid hex color, otherwise use color picker value
      const colorText = this.conflictColorTextInput.value.trim();
      const colorValue = colorText && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/i.test(colorText)
        ? colorText
        : this.conflictColorInput.value;

      const settings: Partial<ExtensionSettings> = {
        overlayEnabled: this.overlayEnabledInput.checked,
        conflictColor: colorValue,
        calendarIds: this.getSelectedCalendarIds(),
        focusmateApiKey: null, // API key no longer needed - sessions detected from DOM or Google Calendar
        debugLogging: this.debugLoggingInput.checked,
      };

      // Save settings
      this.showLoading(true);
      await this.settingsManager.saveSettings(settings);
      this.currentSettings = { ...this.currentSettings!, ...settings };
      this.showLoading(false);

      // Show success message
      this.showSuccess('Settings saved successfully!');

      // Clear status message after 3 seconds
      setTimeout(() => {
        this.clearStatus();
      }, 3000);
    } catch (error) {
      this.showLoading(false);
      this.showError(`Failed to save settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles cancel button click
   */
  private handleCancel(): void {
    // Reload settings to discard changes
    this.loadData();
    this.clearStatus();
  }

  /**
   * Gets selected calendar IDs from checkboxes
   */
  private getSelectedCalendarIds(): string[] {
    const checkboxes = this.calendarListContainer.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]'
    );
    const selected: string[] = [];

    for (const checkbox of checkboxes) {
      if (checkbox.checked) {
        selected.push(checkbox.value);
      }
    }

    return selected;
  }

  /**
   * Validates user input
   */
  private validateInput(): boolean {
    // Validate color format
    const color = this.conflictColorInput.value.trim();
    if (color && !this.isValidColor(color)) {
      this.showError('Invalid color format. Use hex (#rrggbb) or CSS color names.');
      this.conflictColorInput.focus();
      return false;
    }

    // Validate at least one calendar selected
    const selectedCalendars = this.getSelectedCalendarIds();
    if (selectedCalendars.length === 0) {
      this.showError('Please select at least one calendar.');
      return false;
    }

    return true;
  }

  /**
   * Validates if a string is a valid CSS color
   */
  private isValidColor(color: string): boolean {
    // Check hex format (#rrggbb or #rgb)
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) {
      return true;
    }

    // Check CSS color names (basic check - create element and check if color is valid)
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
  }

  /**
   * Shows loading indicator
   */
  private showLoading(show: boolean): void {
    if (show) {
      this.loadingIndicator.style.display = 'block';
      this.saveButton.disabled = true;
      this.cancelButton.disabled = true;
    } else {
      this.loadingIndicator.style.display = 'none';
      this.saveButton.disabled = false;
      this.cancelButton.disabled = false;
    }
  }

  /**
   * Shows success message
   */
  private showSuccess(message: string): void {
    this.statusMessage.textContent = message;
    this.statusMessage.className = 'status-message status-success';
    this.statusMessage.style.display = 'block';
  }

  /**
   * Shows error message
   */
  private showError(message: string): void {
    this.statusMessage.textContent = message;
    this.statusMessage.className = 'status-message status-error';
    this.statusMessage.style.display = 'block';
  }

  /**
   * Clears status message
   */
  private clearStatus(): void {
    this.statusMessage.style.display = 'none';
    this.statusMessage.textContent = '';
  }
}

// Initialize options page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const optionsUI = new OptionsUI();
  optionsUI.initialize().catch((error) => {
    console.error('Failed to initialize options page:', error);
  });
});
