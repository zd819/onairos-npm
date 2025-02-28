"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Box;
var _react = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function Box(_ref) {
  let {
    active,
    onSelectionChange,
    changeGranted,
    number,
    title,
    type
  } = _ref;
  const [isChecked, setIsChecked] = (0, _react.useState)(false);
  const handleCheckboxChange = e => {
    console.log("Active: ", active, "Checked box : ", isChecked);
    // Use the event's checked value directly
    const newCheckedState = e.target.checked;
    // setIsChecked(newCheckedState);
    setIsChecked(newCheckedState);
    console.log("With new Checked state now being: ", newCheckedState);

    // // Update the counter
    // if (newCheckedState) {
    //   changeGranted(1);
    // } else {
    //   changeGranted(-1);
    // }

    // onSelectionChange(type);
  };

  // Reset checkbox when overlay closes or becomes inactive
  (0, _react.useEffect)(() => {
    if (!active) {
      setIsChecked(false);
    }
  }, [active]);
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "group",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: `flex items-center mb-4 transition-all duration-200 ${!active ? 'opacity-50' : 'hover:opacity-90'}`,
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        id: `checkbox-${number}`,
        type: "checkbox",
        value: "",
        checked: isChecked // Controlled component
        ,
        onChange: handleCheckboxChange,
        disabled: !active,
        className: `
            w-5 h-5 
            rounded
            transition-all duration-200
            focus:ring-2 focus:ring-offset-2
            ${active ? 'text-blue-600 border-gray-300 bg-gray-100 focus:ring-blue-500 cursor-pointer hover:bg-blue-50' : 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'}
            ${isChecked && active ? 'bg-blue-500 border-blue-500' : ''}
          `
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
        htmlFor: `checkbox-${number}`,
        className: `ml-3 flex items-center select-none transition-colors duration-200 ${active ? 'text-gray-900 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`,
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: "text-sm font-medium",
          children: title || `Request ${number}`
        })
      })]
    }), !active && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "ml-9 text-sm text-red-600 animate-fade-in",
      children: "Please create your Personality model to access this Grant Request"
    })]
  });
}