"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = MobileBox;
var _react = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * MobileBox Component
 * Mobile-optimized checkbox component for data request selections
 */function MobileBox(_ref) {
  let {
    active,
    onSelectionChange,
    changeGranted,
    number,
    title,
    type
  } = _ref;
  const [isChecked, setIsChecked] = (0, _react.useState)(false);
  const handleCheckboxChange = e => {
    // Get the checked state
    const newCheckedState = e.target.checked;
    setIsChecked(newCheckedState);

    // Update the counter
    if (newCheckedState) {
      changeGranted(1);
    } else {
      changeGranted(-1);
    }

    // Report the selection change to parent
    onSelectionChange(newCheckedState);
  };

  // Reset checkbox when overlay closes or becomes inactive
  (0, _react.useEffect)(() => {
    if (!active) {
      setIsChecked(false);
    }
  }, [active]);
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "mobile-box-container",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: `mobile-checkbox-wrapper ${!active ? 'inactive' : 'active'}`,
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        id: `mobile-checkbox-${number}`,
        type: "checkbox",
        value: "",
        checked: isChecked,
        onChange: handleCheckboxChange,
        disabled: !active,
        className: `mobile-checkbox ${isChecked && active ? 'checked' : ''}`
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
        htmlFor: `mobile-checkbox-${number}`,
        className: `mobile-checkbox-label ${active ? 'active' : 'inactive'}`,
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "mobile-checkbox-title",
          children: title || `Request ${number}`
        })
      })]
    }), !active && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "mobile-inactive-message",
      children: "Please create your Personality model to access this Grant Request"
    })]
  });
}