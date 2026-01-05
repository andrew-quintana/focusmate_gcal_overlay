# FocusMate Calendar Chrome Extension

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

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the project directory

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

