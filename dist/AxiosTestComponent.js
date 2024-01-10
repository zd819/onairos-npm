"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _axios = _interopRequireDefault(require("axios"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function AxiosTestComponent() {
  const [data, setData] = (0, _react.useState)(null);
  (0, _react.useEffect)(() => {
    _axios.default.get('https://jsonplaceholder.typicode.com/todos/1').then(response => {
      setData(response.data);
    }).catch(error => {
      console.error('Error fetching data: ', error);
      setData(null);
    });
  }, []);
  return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("h2", null, "Axios Test Component"), data ? /*#__PURE__*/_react.default.createElement("pre", null, JSON.stringify(data, null, 2)) : /*#__PURE__*/_react.default.createElement("p", null, "No data fetched"));
}
var _default = exports.default = AxiosTestComponent;
//# sourceMappingURL=AxiosTestComponent.js.map