# OAuth2 Setup Guide

## Quick Fix for "bad client id" Error

The error `OAuth2 request failed: Service responded with error: 'bad client id: {0}'` means your OAuth2 Client ID is either missing or incorrect in `manifest.json`.

## Step-by-Step Setup

### 1. Get Your Extension ID

1. Load the extension in Chrome (`chrome://extensions/` → Load unpacked)
2. Find "FocusMate GCal Overlay" in the list
3. **Copy the Extension ID** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)
   - This ID is shown below the extension name
   - ⚠️ **Important**: This ID can change when you reload the extension in developer mode

### 2. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project name

### 3. Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose:
   - **Internal** (if using Google Workspace)
   - **External** (for personal Google accounts)
3. Fill in required fields:
   - **App name**: `FocusMate GCal Overlay` (or any name)
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue** through:
   - Scopes (no need to add scopes here)
   - **Test users** (if external):
     - ⚠️ **IMPORTANT**: Click **+ ADD USERS**
     - Add your Google account email address
     - Click **Add**
     - You must add yourself as a test user to use the extension!
5. Return to dashboard

### 4. Enable Google Calendar API

1. Navigate to **APIs & Services** → **Library**
2. Search for **"Google Calendar API"**
3. Click **Enable**

### 5. Create OAuth2 Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. **Application type**: Select **Chrome Extension**
4. **Name**: `FocusMate GCal Overlay Extension` (or any name)
5. **Application ID**: Paste your Extension ID from Step 1
   - ⚠️ **Critical**: This must match your extension ID exactly
6. Click **Create**
7. **Copy the Client ID** (format: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

### 6. Update manifest.json

1. Open `manifest.json` in your project
2. Find the `oauth2` section (around line 38-43)
3. Replace `YOUR_GOOGLE_OAUTH2_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID
4. Save the file

**Example:**
```json
"oauth2": {
  "client_id": "123456789-abcdefghijklmnop.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/calendar.readonly"
  ]
}
```

### 7. Rebuild and Reload

```bash
npm run build
```

Then in Chrome:
1. Go to `chrome://extensions/`
2. Click the **reload** icon on your extension
3. **Note**: If the Extension ID changed, update it in Google Cloud Console (Step 5)

## Troubleshooting

### Error: "bad client id: {0}"

**Causes:**
- Client ID in `manifest.json` is still the placeholder
- Client ID doesn't match what's in Google Cloud Console
- Extension ID changed after reload (update it in Google Cloud Console)

**Fix:**
1. Verify Client ID in `manifest.json` matches Google Cloud Console exactly
2. Check that Extension ID in Google Cloud Console matches current extension ID
3. Rebuild: `npm run build`
4. Reload extension

### Error: "Invalid OAuth2 Client ID"

**Cause:** The `oauth2` section is missing or malformed in `manifest.json`

**Fix:** Ensure `manifest.json` has:
```json
"oauth2": {
  "client_id": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["https://www.googleapis.com/auth/calendar.readonly"]
}
```

### Error: 403 access_denied - "app is currently being tested"

**Cause:** Your OAuth app is in "Testing" mode and your Google account isn't added as a test user.

**Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Scroll down to the **Test users** section
4. Click **+ ADD USERS**
5. Enter your Google account email address (the one you're signing in with)
6. Click **Add**
7. Wait a few seconds, then try authenticating again in the extension

**Note:** If you're using "Internal" mode (Google Workspace), you don't need to add test users - all users in your organization can access it automatically.

**Alternative:** If you want to avoid adding test users, you can publish your app, but this requires:
- App verification (can take days/weeks)
- Privacy policy URL
- Terms of service URL
- For personal use, adding yourself as a test user is the easiest solution

### Extension ID Keeps Changing

When you reload an unpacked extension in developer mode, Chrome may assign a new Extension ID. 

**Solution:**
- Option 1: Update the Application ID in Google Cloud Console each time
- Option 2: Use a consistent extension ID by:
  - Publishing to Chrome Web Store (gets permanent ID)
  - Or using the same unpacked directory path

### Can't Find Extension ID

1. Go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Your extension should be listed with its ID below the name
4. If not visible, click **Load unpacked** and select your project directory

## Verification

After setup, test authentication:
1. Open the extension popup or options page
2. Try to load calendars
3. You should see a Google sign-in prompt (first time only)
4. After signing in, calendars should load successfully

If you still see errors, check:
- Browser console for detailed error messages
- Service worker logs (`chrome://extensions/` → your extension → "Service worker")
- That the Client ID format is correct (ends with `.apps.googleusercontent.com`)

