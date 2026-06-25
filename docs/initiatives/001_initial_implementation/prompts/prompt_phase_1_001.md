# Phase 1 Execution Prompt — TypeScript Project Setup & Foundation

## Objective
Set up the TypeScript project structure, build tooling, and foundational type definitions for the Focusmate Calendar Overlay Chrome Extension.

## Context Documents
- @docs/initiatives/001_initial_implementation/scoping/PRD001.md
- @docs/initiatives/001_initial_implementation/scoping/RFC001.md
- @docs/initiatives/001_initial_implementation/scoping/TODO001.md
- @docs/initiatives/001_initial_implementation/scoping/context.md

## Phase Scope
This phase establishes the foundation for the TypeScript-based Chrome extension:
- TypeScript configuration and build setup
- Project directory structure
- Chrome extension manifest configuration
- Core type definitions
- Initial testing infrastructure

## Key Requirements

### TypeScript Setup
- Strict mode enabled
- ES2020 compilation target
- Source maps for debugging
- Module resolution configured for Chrome extension

### Build Tooling
- Choose appropriate build tool (webpack/rollup/esbuild)
- Output compiled JavaScript to `dist/` directory
- Watch mode for development
- Build scripts in `package.json`

### Project Structure
Create the following directory structure:
```
src/
├── background/
├── content/
├── options/
├── types/
└── utils/
dist/          # Compiled output
tests/
├── fixtures/
└── unit/
```

### Type Definitions
Create type definitions in `src/types/`:
- `events.ts`: GCalEvent, FocusmateSession, ConflictMap
- `messages.ts`: Message types for content↔background communication
- `storage.ts`: ExtensionSettings interface and storage keys

### Manifest Configuration
- Update `manifest.json` to reference compiled files in `dist/`
- Configure permissions: `identity`, `storage`
- Configure host permissions for Focusmate and Google APIs
- Set up content scripts for Focusmate domain only

## Implementation Tasks

Refer to @docs/initiatives/001_initial_implementation/scoping/TODO001.md Phase 1 section for detailed checklist.

## Validation Requirements

1. **TypeScript Compilation**: Verify `npm run build` succeeds without errors
2. **Build Output**: Verify compiled JavaScript files are in `dist/` directory
3. **Manifest**: Verify `manifest.json` correctly references `dist/` files
4. **Extension Loading**: Test extension loads in Chrome Developer Mode without errors
5. **Type Safety**: Verify strict TypeScript checking is enabled

## Documentation Requirements

After completing this phase, create:

1. **`intermediate/phase_1_decisions.md`**
   - Document build tool choice and rationale
   - Document any TypeScript configuration decisions
   - Document project structure decisions
   - Document any deviations from RFC

2. **`intermediate/phase_1_testing.md`**
   - Document compilation test results
   - Document extension loading test results
   - Document any issues encountered and resolutions

3. **`intermediate/phase_1_handoff.md`**
   - Document build commands and workflow
   - Document project structure
   - Document any setup issues and solutions
   - Document dependencies installed
   - Provide clear instructions for Phase 2

## Checklist Updates

As you complete tasks, update the checkboxes in:
- @docs/initiatives/001_initial_implementation/scoping/TODO001.md Phase 1 section

## Important Notes

- All source code must be TypeScript (`.ts` files)
- No JavaScript source files (only compiled output in `dist/`)
- Follow file organization requirements from TODO001.md
- Use `@types/chrome` for Chrome API type definitions
- Ensure build process is documented and reproducible

## Success Criteria

- [ ] TypeScript project compiles successfully
- [ ] Extension loads in Chrome without errors
- [ ] All type definitions are created and properly typed
- [ ] Build process is documented
- [ ] Phase 1 handoff document is complete

