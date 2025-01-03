"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Notification;
var _react = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function Notification(_ref) {
  let {
    message,
    color = null,
    again = false
  } = _ref;
  const [show, setShow] = (0, _react.useState)(true);
  (0, _react.useEffect)(() => {
    setShow(true); // Show notification again when `again` changes
    const timer = setTimeout(() => {
      setShow(false);
    }, 5000);

    // Clear timeout if the component unmounts or `again` changes
    return () => clearTimeout(timer);
  }, [again]); // Dependency array includes `again` so it resets when the prop changes

  return show && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: `fixed top-0 left-1/2 transform -translate-x-1/2 text-white px-4 py-2 rounded-b-md shadow-lg z-50 text-center ${color == null ? 'bg-red-600' : `bg-${color}-600`}`,
    children: message
  });
}