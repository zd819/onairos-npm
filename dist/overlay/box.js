"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _propTypes = _interopRequireDefault(require("prop-types"));
var _react = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// import Sentiment from '../icons/Sentiment.png';
// import Avatar from '../icons/Avatar.png';
// import Avatar2 from '../icons/Avatar2.png';
// import Trait from '../icons/Trait.png';

function Box(_ref) {
  let {
    active,
    onSelectionChange,
    changeGranted,
    setSelected,
    number
  } = _ref;
  const [isChecked, setIsChecked] = (0, _react.useState)(false);
  const handleChange = e => {
    const newCheckedState = e.target.checked;
    setIsChecked(newCheckedState);
    setSelected(newCheckedState);
    onSelectionChange(newCheckedState);
    changeGranted(prev => newCheckedState ? prev + 1 : prev - 1);
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "relative inline-block",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
      type: "checkbox",
      checked: isChecked,
      onChange: handleChange,
      className: "hidden",
      id: `box-${number}`
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
      htmlFor: `box-${number}`,
      className: `w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer transition-all duration-200 ${isChecked ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}`,
      children: isChecked && /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
        className: "w-3 h-3 text-white",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "3",
          d: "M5 13l4 4L19 7"
        })
      })
    })]
  });
}
var _default = exports.default = Box;