"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _Sentiment = _interopRequireDefault(require("../icons/Sentiment.png"));
var _Avatar = _interopRequireDefault(require("../icons/Avatar.png"));
var _Avatar2 = _interopRequireDefault(require("../icons/Avatar2.png"));
var _Trait = _interopRequireDefault(require("../icons/Trait.png"));
var _checkbox = require("@/components/ui/checkbox");
var _label = require("@/components/ui/label");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Box Component
 * Displays a checkbox item for data access requests with appropriate icons
 */const Box = props => {
  const selectShortlistedApplicant = e => {
    const checked = e.target.checked;
    console.log(`Checkbox ${props.title} is now: ${checked ? 'checked' : 'unchecked'}`);
    if (checked) {
      props.setSelected(true);
      props.changeGranted(1);
    } else {
      props.setSelected(false);
      props.changeGranted(-1);
    }
  };
  const Insight = props.title === "Avatar" ? 'Avatar' : props.title === "Traits" ? 'Personality Traits' : 'Persona';
  const getIcon = () => {
    switch (props.title) {
      case "Traits":
        return /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
          src: _Trait.default || "/placeholder.svg",
          alt: "Traits",
          className: "w-5 h-5"
        });
      case "Avatar":
        return /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
          src: _Avatar2.default || "/placeholder.svg",
          alt: "Avatar",
          className: "w-5 h-5"
        });
      default:
        return /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
          src: _Sentiment.default || "/placeholder.svg",
          alt: "Interest",
          className: "w-5 h-5"
        });
    }
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "space-y-4",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex items-start space-x-3",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_checkbox.Checkbox, {
        id: `request-${props.number}`,
        disabled: !props.active,
        onCheckedChange: checked => {
          selectShortlistedApplicant({
            target: {
              checked
            }
          });
          props.onSelectionChange(checked);
        },
        className: `h-5 w-5 ${!props.active ? "cursor-not-allowed" : ""}`
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_label.Label, {
        htmlFor: `request-${props.number}`,
        className: "flex items-center space-x-3 text-sm font-medium text-black peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "p-1 bg-gray-50 rounded-md",
          children: getIcon()
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
          children: ["Access your ", props.title]
        })]
      })]
    }), !props.active && /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
      className: "text-xs text-red-600 font-medium ml-8",
      children: "Please create your Personality model to access this Grant Request"
    })]
  });
};
var _default = exports.default = Box;