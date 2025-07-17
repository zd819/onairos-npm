# Changelog

## [2.0.0] - 2024-01-15

### 🚀 Major Release - Simplified Integration & Enhanced UX

#### ✨ New Features
- **Popup-based Data Requests**: Completely redesigned iframe implementation using popup windows
  - Fixes display cutoff issues seen in previous versions
  - Better positioning and sizing (450x700px)
  - Proper focus management and cross-browser compatibility

- **AutoFetch by Default**: Automatic API calls after user approval
  - No more manual event handling required
  - API responses included directly in onComplete callback
  - Configurable with `autoFetch` prop (default: true)

- **Simplified OnairosButton Component**: Much cleaner integration
  ```jsx
  // Before v2.0 (complex)
  <Onairos requestData={complexRequestObject} webpageName={webpageName} />
  // + manual event listeners for API handling
  
  // After v2.0 (simple)
  <OnairosButton
    requestData={['email', 'profile']}
    webpageName="My App"
    onComplete={(result) => console.log(result.apiResponse)}
  />
  ```

#### 🎨 Enhanced User Experience
- **Real-time Status Updates**: Loading states and progress indicators
- **Better Error Handling**: User-friendly error messages and retry logic
- **Visual Feedback**: Selection summaries and confirmation states
- **Smart Button Text**: Adapts based on autoFetch setting

#### 🔧 Technical Improvements
- **Robust Popup Communication**: Improved postMessage handling with retry logic
- **Memory Management**: Proper cleanup of event listeners and popup references
- **TypeScript Support**: Updated type definitions for new API
- **Cross-browser Compatibility**: Tested on Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

#### 📚 Documentation
- **Comprehensive README**: Updated with simple usage examples
- **Migration Guide**: Clear path from v1.x to v2.0
- **Implementation Guide**: Detailed popup implementation documentation
- **Test Files**: Example implementations for testing

#### 🔄 API Changes
- **New Response Format**: Includes apiResponse and apiError fields when autoFetch is enabled
- **Simplified Props**: Array-based requestData instead of complex objects
- **Backward Compatibility**: Legacy format still documented for reference

#### 🐛 Bug Fixes
- Fixed iframe cutoff issues with popup implementation
- Improved error handling for blocked popups
- Better handling of API failures and network issues
- Fixed memory leaks with proper cleanup

### Migration from v1.x

**Installation remains the same:**
```bash
npm install onairos
```

**Simple migration example:**
```jsx
// v1.x (complex)
const requestData = {
  Small: { type: "Personality", descriptions: "...", reward: "..." },
  Medium: { type: "Personality", descriptions: "...", reward: "..." },
  Large: { type: "Personality", descriptions: "...", reward: "..." }
};

// v2.0 (simple)
const requestData = ['email', 'profile', 'social'];
```

For detailed migration instructions, see the [README.md](./README.md#migration-from-v1x).

---

## [1.0.17] - Previous Release

### Features
- Initial iframe implementation
- Manual API handling with window.sendMessage
- Complex request object format
- Extension-based data requests

### Known Issues
- Iframe display cutoff problems
- Complex integration requiring manual event handling
- Limited error handling capabilities

---

## Development Notes

- **Breaking Changes**: v2.0.0 introduces significant API simplifications
- **Backward Compatibility**: Legacy documentation preserved for reference
- **Future Plans**: Enhanced mobile support, offline capabilities, custom API endpoints 