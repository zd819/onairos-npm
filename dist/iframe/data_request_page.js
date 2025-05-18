"use strict";

var _react = _interopRequireDefault(require("react"));
var _client = require("react-dom/client");
var _DataRequestPage = _interopRequireDefault(require("./DataRequestPage"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// Initial state - will be updated with data from parent window
let requestData = {};
let dataRequester = 'App';
let proofMode = false;
let domain = '';
let hashedOthentSub = null;
let encryptedUserPin = null;

// Handle messages from the parent window
window.addEventListener('message', event => {
  // Verify the sender origin if needed
  // if (event.origin !== "expected-origin") return;

  if (event.data && event.data.type === 'initDataRequest') {
    // Update state variables
    requestData = event.data.requestData || {};
    dataRequester = event.data.dataRequester || 'App';
    proofMode = event.data.proofMode || false;
    domain = event.data.domain || '';
    hashedOthentSub = event.data.hashedOthentSub || null;
    encryptedUserPin = event.data.encryptedUserPin || null;

    // Re-render with the new data
    renderApp();
  }
});

// Notify the parent window that the iframe is ready
window.parent.postMessage({
  source: 'onairosIframe',
  action: 'iframeReady'
}, '*');

// Render the React component
function renderApp() {
  const root = (0, _client.createRoot)(document.getElementById('root'));
  root.render(/*#__PURE__*/(0, _jsxRuntime.jsx)(_react.default.StrictMode, {
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_DataRequestPage.default, {
      requestData: requestData,
      dataRequester: dataRequester,
      proofMode: proofMode,
      domain: domain
    })
  }));
}

// Initial render
renderApp();