"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Onairos = Onairos;
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _onairosButton = require("./onairosButton.jsx");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// Configuration object for the Telegram SDK

function Onairos(props) {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_onairosButton.OnairosButton, {
      ...props
    })
  });
}
var _default = exports.default = Onairos;