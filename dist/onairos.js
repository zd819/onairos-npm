"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _OnairosBlack = _interopRequireDefault(require("./OnairosBlack.png"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function Onairos(_ref) {
  let {
    sendData,
    onairosID,
    access_token
  } = _ref;
  const OnairosAnime = async () => {
    try {
      console.log("Clicked Onairos Connect");
      await ConnectOnairos();
    } catch (error) {
      // Handle any errors here
      console.error("Error connecting to Onairos", error);
    }
  };
  const ConnectOnairos = async () => {
    // Title here has to match a model in the Users : accountInfo.AccountInfo.models
    // Prepare the data to be sent
    // Send the data to the content script
    window.postMessage({
      source: 'webpage',
      type: 'GET_API_URL',
      webpage: 'proxy book store',
      onairosID: onairosID,
      access_token: access_token,
      account: "ConnectedAccountRef.current",
      //No Longer needed, REMOVE
      requestData: sendData
    });
  };
  return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("button", {
    className: "OnairosConnect flex flex-col items-center justify-center text-white font-bold py-2 px-4 rounded cursor-pointer",
    onClick: OnairosAnime
  }, /*#__PURE__*/_react.default.createElement("img", {
    src: _OnairosBlack.default,
    alt: "Onairos Logo",
    className: "w-5 h-5 max-w-10 object-scale-down mb-2"
  }), /*#__PURE__*/_react.default.createElement("span", null, "Connect to Onairos")));
}
var _default = exports.default = Onairos;