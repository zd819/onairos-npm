"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _box = _interopRequireDefault(require("./box"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function IndividualConnection(props) {
  const [selected, setSelected] = (0, _react.useState)(false);
  const isDisabled = !props.active;
  const Insight = props.title === "Avatar" ? 'Avatar' : props.title === "Traits" ? 'Personality Traits' : 'Persona';
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: `relative p-4 sm:p-6 rounded-sm overflow-hidden mb-8 ${isDisabled ? 'bg-gray-100' : 'bg-indigo-200'}`,
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "relative",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex-center",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_box.default, {
          active: props.active,
          onSelectionChange: isSelected => {
            setSelected(isSelected);
            props.onSelectionChange(isSelected);
            if (isSelected) {
              props.changeGranted(1);
            } else {
              props.changeGranted(-1);
            }
          },
          disabled: isDisabled,
          setSelected: setSelected,
          number: props.number + 1,
          type: "Test",
          title: props.title
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex items-center mt-2",
        children: isDisabled && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-sm text-red-500 font-medium",
          children: `No ${props.title} data available to share`
        })
      }), props.descriptions && props.title !== "Avatar" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
        className: `text-sm font-medium ${isDisabled ? 'text-gray-500' : 'text-gray-900'} dark:text-gray-300`,
        children: ["Intent: ", props.descriptions]
      }), props.rewards && /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
        className: `text-sm font-medium ${isDisabled ? 'text-gray-500' : 'text-gray-900'} dark:text-gray-300`,
        children: ["Rewards: ", props.rewards]
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
  changeGranted: _propTypes.default.func.isRequired,
  onSelectionChange: _propTypes.default.func.isRequired
};
var _default = exports.default = IndividualConnection;