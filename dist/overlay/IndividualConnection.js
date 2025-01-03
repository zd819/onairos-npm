"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = IndividualConnection;
var _react = _interopRequireWildcard(require("react"));
var _box = _interopRequireDefault(require("./box"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// import traitsIcon;
// import interestIcon;
// import Sentiment from '../icons/Sentiment.png';
// import Avatar from '../icons/Avatar.png';
// import Avatar2 from '../icons/Avatar2.png';
// import Trait from '../icons/Trait.png';

function IndividualConnection(props) {
  const [selected, setSelected] = (0, _react.useState)(false);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: "bg-white rounded-lg p-4 shadow border border-gray-200",
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex items-center justify-between",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex items-center space-x-4",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_box.default, {
          active: props.active,
          onSelectionChange: props.onSelectionChange,
          changeGranted: props.changeGranted,
          setSelected: setSelected,
          number: props.number + 1,
          type: "Test",
          title: props.title
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex items-center"
      }), props.descriptions && props.title !== "Avatar" && /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
        className: "text-sm font-medium text-gray-900 dark:text-gray-300",
        children: ["Intent: ", props.descriptions]
      }), props.rewards && /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
        className: "text-sm font-medium text-gray-900 dark:text-gray-300",
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