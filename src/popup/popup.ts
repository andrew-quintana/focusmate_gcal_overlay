/**
 * Popup script for Chrome extension
 * Handles authentication and quick actions
 */

import type { AuthStatusResponse, AuthenticateResponse } from '../types/messages';

/**
 * Popup controller
 */
class PopupController {
  private authButton: HTMLButtonElement;
  private optionsButton: HTMLButtonElement;
  private statusDiv: HTMLElement;

  constructor() {
    this.authButton = document.getElementById('authButton') as HTMLButtonElement;
    this.optionsButton = document.getElementById('optionsButton') as HTMLButtonElement;
    this.statusDiv = document.getElementById('status') as HTMLElement;

    this.setupEventHandlers();
    this.checkAuthStatus();
  }

  /**
   * Sets up event handlers
   */
  private setupEventHandlers(): void {
    this.authButton.addEventListener('click', () => this.handleAuth());
    this.optionsButton.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  /**
   * Checks authentication status
   */
  private async checkAuthStatus(): Promise<void> {
    try {
      // Try to get a token (non-interactive)
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }) as AuthStatusResponse | undefined;
      
      if (response && response.authenticated) {
        this.showStatus('Authenticated with Google Calendar', 'authenticated');
        this.authButton.textContent = 'Re-authenticate';
        this.authButton.disabled = false;
      } else {
        this.showStatus('Not authenticated. Click to sign in.', 'not-authenticated');
        this.authButton.disabled = false;
      }
    } catch (error) {
      this.showStatus('Not authenticated. Click to sign in.', 'not-authenticated');
      this.authButton.disabled = false;
    }
  }

  /**
   * Handles authentication button click
   */
  private async handleAuth(): Promise<void> {
    this.authButton.disabled = true;
    this.showStatus('Opening authentication...', 'loading');

    try {
      const response = await chrome.runtime.sendMessage({ type: 'AUTHENTICATE' }) as AuthenticateResponse | undefined;
      
      if (response && response.ok) {
        this.showStatus('Successfully authenticated!', 'authenticated');
        this.authButton.textContent = 'Re-authenticate';
        
        // Update status after a moment
        setTimeout(() => {
          this.checkAuthStatus();
        }, 2000);
      } else {
        const errorMessage = response?.error || 'Authentication failed';
        if (errorMessage.includes('cancelled')) {
          this.showStatus('Authentication cancelled', 'not-authenticated');
        } else {
          this.showStatus(`Error: ${errorMessage}`, 'error');
        }
      }
    } catch (error) {
      this.showStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      this.authButton.disabled = false;
    }
  }

  /**
   * Shows status message
   */
  private showStatus(message: string, className: string): void {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `status ${className}`;
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

