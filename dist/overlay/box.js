"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Box;
var _propTypes = _interopRequireDefault(require("prop-types"));
var _jsxRuntime = require("react/jsx-runtime");
// import Sentiment from '../icons/Sentiment.png';
// import Avatar from '../icons/Avatar.png';
// import Avatar2 from '../icons/Avatar2.png';
// import Trait from '../icons/Trait.png';

function Box(props) {
  const selectShortlistedApplicant = e => {
    const checked = e.target.checked;
    if (checked) {
      props.setSelected(true);
      props.changeGranted(1);
      // console.log("Checked");
    } else {
      props.setSelected(false);
      props.changeGranted(-1);
      // console.log("UnChecked");
    }
  };
  const Insight = props.title === "Avatar" ? 'Avatar' : props.title === "Traits" ? 'Personality Traits' : 'Persona';
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex items-center mb-4",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        onClick: e => {
          selectShortlistedApplicant(e);
          props.onSelectionChange(props.type);
          // console.log("New selection in Box : ", props.type, " and event: ", e);
        },
        id: "default-checkbox",
        type: "checkbox",
        value: "",
        disabled: !props.active,
        className: `w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 ${!props.active ? "cursor-not-allowed" : ""}`
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
        for: "default-checkbox",
        className: "ml-2 text-sm font-medium text-gray-900 dark:text-gray-300",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-column",
          children: [props.title === "Traits" ?
          /*#__PURE__*/
          // Image to represent Traits
          // <img src={Trait} alt="Traits Icon" className="w-6 h-6 mr-2" />
          (0, _jsxRuntime.jsx)("img", {
            src: "https://onairos.sirv.com/Images/OnairosWhite.png",
            alt: "Traits Icon",
            className: "w-6 h-6 mr-2"
          }) : props.title === "Avatar" ?
          /*#__PURE__*/
          // Image to represent Traits
          // <img src={Avatar2} alt="Avatar Icon" className="w-6 h-6 mr-2" />
          (0, _jsxRuntime.jsx)("img", {
            src: "https://onairos.sirv.com/Images/OnairosWhite.png",
            alt: "Avatar Icon",
            className: "w-6 h-6 mr-2"
          }) :
          /*#__PURE__*/
          // Image to represent Interest
          // <img src={Sentiment} alt="Interest Icon" className="w-6 h-6 mr-2" />
          (0, _jsxRuntime.jsx)("img", {
            src: "https://onairos.sirv.com/Images/OnairosWhite.png",
            alt: "Interest Icon",
            className: "w-6 h-6 mr-2"
          }), "Access your ", Insight]
        })
      })]
    }), !props.active && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "ml-6 text-md text-red-600",
      children: "Please create your Personality model to access this Grant Request"
    })]
  });
}
Box.propTypes = {
  active: _propTypes.default.bool.isRequired,
  onSelectionChange: _propTypes.default.func.isRequired,
  changeGranted: _propTypes.default.func.isRequired,
  setSelected: _propTypes.default.func.isRequired,
  number: _propTypes.default.number.isRequired,
  type: _propTypes.default.string.isRequired,
  title: _propTypes.default.string.isRequired
};