"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _Box = _interopRequireDefault(require("./Box"));
var _card = require("@/components/ui/card");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * IndividualConnection Component
 * Displays a card for each data connection request
 */function IndividualConnection(props) {
  const [selected, setSelected] = (0, _react.useState)(false);
  const handleSelectionChange = isSelected => {
    setSelected(isSelected);
    props.onSelectionChange(isSelected);
  };

  // The insight type based on title
  const Insight = props.title === "Avatar" ? 'Avatar' : props.title === "Traits" ? 'Personality Traits' : 'Persona';
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_card.Card, {
    className: "overflow-hidden outline-2 outline-black/10 bg-white shadow-sm hover:shadow-md transition-all",
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "p-4 space-y-2",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex items-start justify-between",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_Box.default, {
          active: props.active,
          onSelectionChange: handleSelectionChange,
          changeGranted: props.changeGranted,
          setSelected: setSelected,
          number: props.number + 1,
          type: "Test",
          title: props.title
        })
      }), props.descriptions && props.title !== "Avatar" && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "space-y-2 border-t pt-3",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col space-y-1",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-xs font-semibold text-black/70",
            children: "Intent"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-sm text-black",
            children: props.descriptions
          })]
        })
      }), props.rewards && /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex flex-col space-y-1 border-t pt-3",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-xs font-semibold text-black/70",
          children: "Rewards"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-sm text-black",
          children: props.rewards
        })]
      })]
    })
  });
}
var _default = exports.default = IndividualConnection;