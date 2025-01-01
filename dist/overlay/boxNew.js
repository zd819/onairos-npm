"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _jsxRuntime = require("react/jsx-runtime");
function Box(_ref) {
  let {
    active,
    onSelectionChange,
    disabled,
    title
  } = _ref;
  const handleClick = () => {
    if (!disabled) {
      onSelectionChange(!active);
    }
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    onClick: handleClick,
    className: `
        flex items-center justify-between p-4 rounded-lg cursor-pointer
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : active ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'}
        transition-colors duration-200
      `,
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex items-center",
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: `text-lg font-medium ${disabled ? 'text-gray-400' : active ? 'text-white' : 'text-gray-900'}`,
        children: title
      })
    }), !disabled && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: `
          w-6 h-6 rounded-full border-2 flex items-center justify-center
          ${active ? 'border-white bg-blue-600' : 'border-gray-300 bg-white'}
        `,
      children: active && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "text-white",
        children: "\u2713"
      })
    }), disabled && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "w-6 h-6 rounded-full border-2 border-gray-300 bg-gray-200 flex items-center justify-center",
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        className: "text-gray-400",
        children: "\xD7"
      })
    })]
  });
}
Box.propTypes = {
  active: _propTypes.default.bool.isRequired,
  onSelectionChange: _propTypes.default.func.isRequired,
  disabled: _propTypes.default.bool,
  title: _propTypes.default.string.isRequired
};
var _default = exports.default = Box;