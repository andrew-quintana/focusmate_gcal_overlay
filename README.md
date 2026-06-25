# FocusMate GCal Overlay Chrome Extension

A Chrome extension for managing FocusMate calendar, built with TypeScript.

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Chrome browser

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build TypeScript:
```bash
npm run build
```

Or use watch mode for automatic rebuilding:
```bash
npm run watch
```

### OAuth2 Setup (Required)

This extension uses Google OAuth2 to access the Google Calendar API. 

**📖 See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for detailed step-by-step instructions.**

Quick summary:

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Note your project name/number

2. **Configure OAuth Consent Screen:**
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Choose "Internal" (for Google Workspace) or "External" (for personal use)
   - Fill in required fields:
     - App name: "FocusMate GCal Overlay" (or any name)
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue" through the scopes screen (no need to add scopes here)
   - Click "Save and Continue" through the test users screen (if external)
   - Review and return to dashboard

3. **Enable Google Calendar API:**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. **Get Your Extension ID:**
   - Load the extension in Chrome (see "Loading the Extension" below)
   - Go to `chrome://extensions/`
   - Find your extension and copy the **Extension ID** (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

5. **Create OAuth2 Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose **"Chrome Extension"** as the application type
   - **Important**: Enter your Extension ID from step 4 in the "Application ID" field
   - Click "Create"
   - **Copy the Client ID** (format: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

6. **Configure the Extension:**
   - Open `manifest.json`
   - Replace `YOUR_GOOGLE_OAUTH2_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID from step 5
   - **Important**: The Client ID must end with `.apps.googleusercontent.com`
   - Save the file
   - Rebuild if needed: `npm run build`
   - Reload the extension in Chrome

**Troubleshooting:**
- **"bad client id" error**: 
  - Verify the Client ID in `manifest.json` matches exactly what Google Cloud Console generated
  - Ensure the Extension ID in Google Cloud Console matches your current extension ID
  - If you reloaded the extension, the ID may have changed - update it in Google Cloud Console
- **"Invalid OAuth2 Client ID" error**: 
  - Make sure the `oauth2` section exists in `manifest.json`
  - Verify the Client ID format is correct (ends with `.apps.googleusercontent.com`)

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the project directory
5. **Note your Extension ID** (displayed on the extension card) - you'll need this for OAuth2 setup

### Project Structure

```
focusmate_cal/
├── src/              # TypeScript source files
│   ├── popup.ts
│   ├── background.ts
│   ├── content.ts
│   └── options.ts
├── dist/             # Compiled JavaScript (generated)
├── manifest.json     # Extension manifest
├── popup.html        # Popup HTML
├── options.html      # Options page HTML
├── styles/           # CSS files
└── icons/            # Extension icons
```

### Development Workflow

1. Make changes to TypeScript files in `src/`
2. Run `npm run build` (or `npm run watch` in another terminal)
3. Reload the extension in Chrome (`chrome://extensions/` → Reload icon)
4. Test your changes

### Debugging

- **Popup**: Right-click extension icon → Inspect popup
- **Background**: `chrome://extensions/` → Find extension → Click "Service worker" link
- **Content Scripts**: Open DevTools on any page where content script runs
- **Options**: Right-click options page → Inspect

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for automatic rebuilding
- `npm run clean` - Remove compiled files

## TypeScript

This project uses TypeScript for type safety. The source files are in `src/` and compile to `dist/`. The manifest.json references the compiled files in `dist/`.

### Type Definitions

Chrome Extension API types are provided by `@types/chrome`. These give you full type safety when using Chrome Extension APIs.

## License

MIT

