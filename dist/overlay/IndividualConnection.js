"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = IndividualConnection;
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function IndividualConnection(_ref) {
  let {
    active,
    title,
    id,
    number,
    descriptions,
    rewards,
    size,
    isChecked,
    onCheckboxChange
  } = _ref;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: "bg-white rounded-lg p-4 shadow border border-gray-200",
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex items-center justify-between",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex items-center space-x-4",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "group",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
              disabled: !active,
              type: "checkbox",
              checked: isChecked,
              onChange: e => onCheckboxChange(e.target.checked)
            })
          })
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex items-center"
      }), descriptions && title !== "Avatar" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
        className: "text-sm font-medium text-gray-900 dark:text-gray-300",
        children: ["Intent: ", descriptions]
      }), rewards && /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
        className: "text-sm font-medium text-gray-900 dark:text-gray-300",
        children: ["Rewards: ", rewards]
      })]
    })
  });
}
IndividualConnection.propTypes = {
  active: _propTypes.default.bool.isRequired,
  title: _propTypes.default.string.isRequired,
  id: _propTypes.default.any.isRequired,
  number: _propTypes.default.number.isRequired,
  descriptions: _propTypes.default.string,
  rewards: _propTypes.default.string,
  size: _propTypes.default.string.isRequired,
  isChecked: _propTypes.default.bool.isRequired,
  onCheckboxChange: _propTypes.default.func.isRequired
};