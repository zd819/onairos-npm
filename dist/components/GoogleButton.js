"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = GoogleButton;
var _react = _interopRequireWildcard(require("react"));
var _sdk = require("@telegram-apps/sdk");
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function GoogleButton(_ref) {
  let {
    onLoginSuccess = () => {}
  } = _ref;
  const [error, setError] = (0, _react.useState)(null);
  const handleTelegramAuth = (0, _react.useCallback)(async () => {
    setError(null);

    // Check if we're in a Telegram Web App environment
    if (typeof window !== 'undefined' && !window.Telegram?.WebApp) {
      setError('Not running in Telegram Web App');
      return;
    }

    // Check SDK initialization
    if (!_sdk.miniApp.isInitialized) {
      setError('Telegram Mini App not initialized');
      return;
    }
    try {
      // Safely get Telegram Mini App data
      const telegramAppUrl = _sdk.miniApp.initData || '';
      const botUsername = 'OnairosMiniApp';

      // Log debug information
      console.log('Telegram App URL:', telegramAppUrl);
      console.log('Bot Username:', botUsername);

      // Construct URL with error handling
      let connectUrl;
      try {
        connectUrl = new URL('https://onairos.uk/othent-connect');
        connectUrl.searchParams.append('tgAppUrl', encodeURIComponent(telegramAppUrl));
        connectUrl.searchParams.append('botUsername', botUsername);
      } catch (urlError) {
        setError('Error constructing URL: ' + urlError.message);
        return;
      }

      // Register event listener before opening link
      const handleAppActive = () => {
        try {
          const startParam = _sdk.miniApp.initDataUnsafe?.start_param;
          console.log('Start param received:', startParam);
          if (startParam) {
            const authData = JSON.parse(decodeURIComponent(startParam));
            if (authData) {
              onLoginSuccess(authData);
            }
          }
        } catch (error) {
          setError('Error processing auth data: ' + error.message);
        } finally {
          _sdk.miniApp.removeEvent('active', handleAppActive);
        }
      };
      _sdk.miniApp.onEvent('active', handleAppActive);

      // Open link with error handling
      await (0, _sdk.openLink)(connectUrl.toString(), {
        tryInstantView: false
      });
    } catch (error) {
      setError('Auth flow failed: ' + error.message);
      console.error('Full error:', error);
    }
  }, [onLoginSuccess]);
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex flex-col items-center",
    children: [error && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "text-red-500 text-sm mb-2 px-4 py-2 bg-red-50 rounded",
      children: error
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
      onClick: handleTelegramAuth,
      className: "flex items-center justify-center px-4 py-2 border border-gray-300 rounded-full shadow-sm bg-white hover:bg-gray-50 relative",
      type: "button",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("svg", {
        viewBox: "0 0 24 24",
        className: "w-5 h-5 mr-2",
        fill: "#4285F4",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
          d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
          fill: "#4285F4"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
          d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
          fill: "#34A853"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
          d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z",
          fill: "#FBBC05"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
          d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z",
          fill: "#EA4335"
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "text-gray-700",
        children: "Continue with Google"
      })]
    })]
  });
}