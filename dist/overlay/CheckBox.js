"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function Box(_ref) {
  let {
    active,
    onSelectionChange,
    changeGranted,
    setSelected,
    number,
    type,
    title
  } = _ref;
  const [isChecked, setIsChecked] = (0, _react.useState)(false);
  const handleCheckboxChange = newState => {
    setIsChecked(newState);
    console.log("This data request is active :", active);
    console.log("With new Checked state now being: ", newState);
    // Update the counter
    if (newState) {
      changeGranted(1);
    } else {
      changeGranted(-1);
    }
    // onSelectionChange(type);
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: "group",
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        // disabled={!active}
        type: "checkbox",
        checked: isChecked,
        onChange: e => {
          // setIsChecked(e.target.checked);

          handleCheckboxChange(e.target.checked);
        }
      })
    })
  });
}
Box.propTypes = {
  active: _propTypes.default.bool.isRequired,
  onSelectionChange: _propTypes.default.func.isRequired,
  disabled: _propTypes.default.bool,
  title: _propTypes.default.string.isRequired
};
var _default = exports.default = Box;