"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const DeepLink = () => {
  const [message, setMessage] = (0, _react.useState)("No message passed!");
  const [mode, setMode] = (0, _react.useState)("default");
  (0, _react.useEffect)(() => {
    // Check if Telegram's WebApp object is available
    if (window.Telegram && window.Telegram.WebApp) {
      // Tell Telegram the app is ready
      window.Telegram.WebApp.ready();

      // Access initData
      const initData = window.Telegram.WebApp.initDataUnsafe;
      const startParam = initData?.start_param || "No data found!";
      const modeParam = initData?.mode || "default";
      setMessage(startParam);
      setMode(modeParam);
    } else {
      // Handle case where Telegram SDK is not available
      console.warn("Telegram WebApp is not available!");
      setMessage("Telegram WebApp is not available!");
    }
  }, []);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: "min-h-screen flex items-center justify-center bg-gray-100",
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "p-4 bg-white shadow-lg rounded-lg",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h1", {
        className: "text-2xl font-bold",
        children: "Welcome to Onairos Mini App"
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
        className: "mt-4 text-lg",
        children: ["Message: ", message]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
        className: "mt-2 text-sm",
        children: ["Mode: ", mode]
      })]
    })
  });
};
var _default = exports.default = DeepLink;