"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = MobileIndividualConnection;
var _react = _interopRequireDefault(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * MobileIndividualConnection Component
 * Mobile-optimized version of the IndividualConnection component
 * for displaying data request options in React Native
 */function MobileIndividualConnection(_ref) {
  let {
    active,
    title,
    id,
    number,
    descriptions,
    rewards,
    size,
    changeGranted,
    onSelectionChange
  } = _ref;
  const handleCheckboxChange = isSelected => {
    // Report the selection to parent component
    onSelectionChange(isSelected);
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "mobile-connection-container",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "mobile-connection-header",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "mobile-connection-checkbox-area",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
          type: "checkbox",
          disabled: !active,
          className: "mobile-connection-checkbox",
          onChange: e => handleCheckboxChange(e.target.checked)
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "mobile-connection-title",
          children: title
        })]
      }), rewards && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "mobile-connection-rewards",
        children: ["Rewards: ", rewards]
      })]
    }), descriptions && title !== "Avatar" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "mobile-connection-description",
      children: ["Intent: ", descriptions]
    })]
  });
}