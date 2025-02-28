"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = TestTelegramButton;
var _react = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function TestTelegramButton() {
  const [error, setError] = (0, _react.useState)(null);
  const [logs, setLogs] = (0, _react.useState)([]);
  const addLog = message => {
    setLogs(prevLogs => [...prevLogs, message]);
  };
  const handleClick = () => {
    try {
      addLog('Opening external browser...');
      const data = {
        key: 'value'
      }; // Example data
      const queryString = new URLSearchParams(data).toString();
      const testUrl = `https://internship.onairos.uk/auth?${queryString}`;
      // const testUrl = `https://onairos.uk/auth?${queryString}`;

      // Use standard JavaScript to open the link in a new tab
      window.open(testUrl, '_blank');
    } catch (error) {
      console.error('Failed to open link:', error);
      addLog(`Failed to open link: ${error.message}`);
      setError(`Failed to open link: ${error.message}`);
    }
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: "flex flex-col items-center p-4",
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
      onClick: handleClick,
      className: "flex flex-col items-center justify-center px-4 py-2 border border-gray-300 rounded-full shadow-sm bg-white hover:bg-gray-50",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "relative",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
          src: "google-icon.png",
          alt: "Google",
          className: "w-10 h-10 rounded-full"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
          className: "absolute bottom-0 right-0 w-4 h-4",
          fill: "currentColor",
          viewBox: "0 0 20 20",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
            d: "M10 3a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H3a1 1 0 110-2h6V4a1 1 0 011-1z"
          })
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "text-gray-700 mt-2",
        children: "Google"
      })]
    })
  });
}