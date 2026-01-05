# Phase 1 Decisions

## Build Tool Choice

**Decision**: Use esbuild for TypeScript compilation and bundling

**Rationale**:
- Modern, fast build tool with excellent TypeScript support
- Simple configuration for Chrome extension with multiple entry points
- Fast compilation and watch mode
- Good source map support for debugging
- Minimal configuration required

**Alternatives Considered**:
- **TypeScript Compiler (tsc)**: Simpler but doesn't bundle, requires separate bundling step
- **Webpack**: More complex configuration, larger dependency footprint
- **Rollup**: Good for libraries, but esbuild is faster and simpler for this use case

## TypeScript Configuration

**Decisions**:
- **Target**: ES2020 - Modern JavaScript features while maintaining Chrome compatibility
- **Module**: ES2020 - Modern module system
- **Strict Mode**: Enabled with additional strict checks:
  - `noUnusedLocals`: true
  - `noUnusedParameters`: true
  - `noImplicitReturns`: true
  - `noFallthroughCasesInSwitch`: true
- **Source Maps**: Enabled for debugging
- **Declaration Maps**: Enabled for better IDE support

**Rationale**: Strict mode ensures type safety and catches common errors early. ES2020 target provides modern features while maintaining compatibility with Chrome extension runtime.

## Project Structure

**Directory Layout**:
```
src/
├── background/     # Background service worker
├── content/       # Content script
├── options/        # Options page
├── types/          # TypeScript type definitions
└── utils/          # Utility functions

dist/               # Compiled JavaScript output
tests/
├── fixtures/       # Test data
├── unit/           # Unit tests
└── mocks/          # Mock implementations
```

**Rationale**: Clear separation of concerns, follows Chrome extension architecture. Types and utils are shared across components.

## Build Configuration

**Entry Points**:
- `src/background/background.ts` → `dist/background.js`
- `src/content/content.ts` → `dist/content.js`
- `src/options/options.ts` → `dist/options.js`

**Build Script**:
- Uses esbuild with IIFE format (Immediately Invoked Function Expression)
- Suitable for Chrome extension scripts
- Source maps enabled for debugging
- No minification in development (can be enabled for production)

## Testing Infrastructure

**Decision**: Use Vitest for testing

**Rationale**:
- Fast, modern test runner
- Excellent TypeScript support
- Compatible with Jest API (familiar syntax)
- Built-in coverage support
- Good performance

**Configuration**:
- Node environment for unit tests
- Coverage provider: v8
- Excludes node_modules, dist, and config files from coverage

## Type Definitions Structure

**Organization**:
- `types/events.ts`: Event and session type definitions
- `types/messages.ts`: Message passing type definitions
- `types/storage.ts`: Storage schema and default values

**Rationale**: Separated by domain for clarity and maintainability. Each file has a single responsibility.

## Manifest Configuration

**Permissions**:
- `storage`: For storing extension settings
- `identity`: For Google OAuth authentication
- `scripting`: For content script injection (if needed)

**Host Permissions**:
- `https://app.focusmate.com/*`: For content script injection
- `https://www.googleapis.com/*`: For Google Calendar API access

**Service Worker**:
- Uses Manifest V3 service worker pattern
- Entry point: `dist/background.js`

## Deviations from RFC

**None**: All decisions align with RFC001.md specifications.

## Future Considerations

1. **Production Build**: Consider adding minification for production builds
2. **Code Splitting**: May not be necessary for Chrome extension, but can be added if bundle size becomes an issue
3. **Type Checking**: Consider adding type checking as a separate script for CI/CD
4. **Linting**: Consider adding ESLint for code quality checks

