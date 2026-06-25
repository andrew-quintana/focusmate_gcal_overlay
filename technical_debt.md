# Technical Debt Documentation

## Overview

This document catalogs known technical debt, limitations, and areas for future improvement in the Focusmate Calendar Overlay Chrome Extension.

**Status**: Active  
**Last Updated**: 2025-01-04

## Testing Gaps

### Unit Test Coverage

**Status**: ✅ Good (80%+ coverage)

**Gaps**:
- DOM detection strategies (difficult to unit test, requires real DOM)
- Overlay rendering (requires Shadow DOM)
- Options page UI interactions (requires browser environment)

**Impact**: Low - Core logic well-tested, UI components tested manually

**Priority**: Low

**Future Work**:
- Consider integration tests with headless Chrome
- Add visual regression tests for overlay
- Add E2E tests for critical user flows

### Integration Tests

**Status**: ⚠️ Manual Only

**Gaps**:
- No automated integration tests
- All integration testing done manually
- No CI/CD pipeline

**Impact**: Medium - Manual testing is time-consuming and error-prone

**Priority**: Medium

**Future Work**:
- Set up automated integration tests
- Use Chrome Extension Testing framework
- Add CI/CD pipeline for automated testing

## Known Issues

### DOM Selector Fragility

**Status**: ⚠️ Known Limitation

**Description**: Focusmate DOM has no stable identifiers. Session detection relies on:
- Accessibility labels
- Time text parsing
- Derived keys from time ranges

**Impact**: High - Focusmate UI changes may break session detection

**Mitigation**:
- Multiple selector strategies with fallbacks
- Centralized selector logic in `domDetector.ts`
- Derived keys from observable attributes

**Priority**: High

**Future Work**:
1. Monitor Focusmate UI changes
2. Update selectors as needed
3. Consider Focusmate API as primary source (if available)
4. Add selector versioning/fallback system
5. Consider machine learning for DOM pattern recognition

### Focusmate API Limitations

**Status**: ⚠️ Known Limitation

**Description**: Focusmate API is:
- User-scoped (not fully productized)
- Date range querying not guaranteed
- No versioning or stability guarantees

**Impact**: Medium - API may not provide reliable date ranges

**Mitigation**:
- Treat API as optional fallback
- Prefer Google Calendar as source of truth
- Use DOM scraping as additional fallback

**Priority**: Medium

**Future Work**:
1. Monitor Focusmate API changes
2. Document API endpoints and limitations
3. Consider requesting official API documentation
4. Add API version detection

### Single Google Account Limitation

**Status**: ⚠️ Known Limitation

**Description**: Extension supports one Google account per instance (though multiple calendars from that account are supported)

**Impact**: Low - Most users have one primary Google account

**Priority**: Low

**Future Work**:
1. Support multiple Google accounts simultaneously
2. Account switching UI
3. Per-account calendar selection

## Future Improvements

### Week View Support

**Status**: 🔄 Partial Support

**Description**: Week view detection is implemented but may need refinement

**Current State**:
- Basic week view detection in `domDetector.ts`
- Week range calculation (Monday to Sunday)
- May not work for all Focusmate week view variations

**Priority**: Medium

**Future Work**:
1. Improve week view detection accuracy
2. Test with various week view layouts
3. Add week view-specific conflict highlighting
4. Support custom week start days

### Performance Optimizations

**Status**: ✅ Good (targets met)

**Potential Improvements**:
1. Virtual scrolling for large event lists (100+ events)
2. Lazy loading of events outside viewport
3. Web Workers for conflict computation (if needed for very large datasets)
4. IndexedDB for event caching (offline support)

**Priority**: Low (current performance is good)

### Offline Support

**Status**: ❌ Not Implemented

**Description**: Extension requires internet connection for Google Calendar API

**Impact**: Low - Most users have constant internet access

**Priority**: Low

**Future Work**:
1. Cache events in IndexedDB
2. Show cached events when offline
3. Sync when connection restored
4. Offline conflict detection

### Multi-Browser Support

**Status**: ❌ Chrome Only

**Description**: Extension is Chrome-specific (Manifest V3)

**Impact**: Medium - Excludes Firefox and Safari users

**Priority**: Medium

**Future Work**:
1. Port to Firefox (WebExtensions API)
2. Port to Safari (different API)
3. Consider cross-browser build system
4. Test on all target browsers

### Advanced Features

**Status**: ❌ Not Implemented

**Potential Features**:
1. Event creation from overlay
2. Session rescheduling suggestions
3. Conflict resolution UI
4. Calendar sync status indicator
5. Recurring event conflict detection
6. Time zone conversion display
7. Event filtering (by calendar, type, etc.)
8. Search/filter events in overlay

**Priority**: Low (out of scope for MVP)

## Code Quality Improvements

### Type Safety

**Status**: ✅ Good (strict TypeScript)

**Potential Improvements**:
1. Remove any remaining `any` types
2. Add stricter type guards
3. Use branded types for IDs
4. Add runtime type validation

**Priority**: Low

### Error Handling

**Status**: ✅ Good (user-friendly messages)

**Potential Improvements**:
1. Error recovery strategies
2. Retry logic with exponential backoff
3. Error reporting (optional, privacy-preserving)
4. Error analytics (optional)

**Priority**: Low

### Code Organization

**Status**: ✅ Good

**Potential Improvements**:
1. Split large files (e.g., `domDetector.ts`)
2. Extract common patterns
3. Add more utility functions
4. Consider state management library (if complexity grows)

**Priority**: Low

## Documentation Gaps

### API Documentation

**Status**: ⚠️ Partial

**Gaps**:
- Focusmate API endpoints not fully documented
- Google Calendar API usage patterns could be more detailed
- Error response formats not documented

**Priority**: Low

**Future Work**:
1. Document all API endpoints used
2. Document error response formats
3. Add API usage examples
4. Create API integration guide

### User Documentation

**Status**: ⚠️ Minimal

**Gaps**:
- No user guide
- No troubleshooting guide
- No FAQ

**Priority**: Medium

**Future Work**:
1. Create user guide
2. Add troubleshooting section
3. Create FAQ
4. Add screenshots/videos

## Security Considerations

### Current State

**Status**: ✅ Good (security review passed)

**Areas for Future Enhancement**:
1. Content Security Policy refinement
2. OAuth token refresh strategy review
3. API key storage encryption review
4. Privacy policy (if published to Chrome Web Store)

**Priority**: Low

## Monitoring and Observability

**Status**: ❌ Not Implemented

**Description**: No monitoring or analytics

**Impact**: Low - Extension is local-only

**Priority**: Low

**Future Work**:
1. Optional error reporting (privacy-preserving)
2. Performance metrics collection (optional)
3. Usage analytics (optional, opt-in)
4. Health checks

## Deployment and Distribution

**Status**: ⚠️ Manual Only

**Description**: Extension distributed as unpacked extension

**Gaps**:
- No Chrome Web Store listing
- No automated deployment
- No version management
- No update mechanism

**Priority**: Medium

**Future Work**:
1. Prepare for Chrome Web Store submission
2. Set up automated builds
3. Version management system
4. Update mechanism
5. Release notes

## Summary

### High Priority

1. **DOM Selector Fragility**: Monitor and update selectors as Focusmate UI changes
2. **Integration Tests**: Set up automated integration testing

### Medium Priority

1. **Multi-Browser Support**: Port to Firefox and Safari
2. **User Documentation**: Create user guide and troubleshooting docs
3. **Deployment**: Prepare for Chrome Web Store submission

### Low Priority

1. **Advanced Features**: Event creation, conflict resolution, etc.
2. **Performance Optimizations**: Virtual scrolling, lazy loading, etc.
3. **Offline Support**: Cache events for offline viewing
4. **Monitoring**: Optional analytics and error reporting

## Tracking

This technical debt is tracked in:
- This document (technical_debt.md)
- TODO001.md (implementation checklist)
- FRACAS.md (failure tracking)

**Review Schedule**: Quarterly or as issues arise

---

**Last Updated**: 2025-01-04  
**Next Review**: 2025-04-04

