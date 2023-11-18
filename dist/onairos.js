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
    requestData,
    onairosID,
    access_token,
    proofMode = false,
    webpageName
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
      webpageName: webpageName,
      onairosID: onairosID,
      access_token: access_token,
      account: "ConnectedAccountRef.current",
      //No Longer needed, REMOVE
      requestData: requestData,
      proofMode: proofMode
    });
  };
  return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("button", {
    className: "OnairosConnect w-20 h-20 flex flex-col items-center justify-center text-white font-bold py-2 px-4 rounded cursor-pointer",
    onClick: OnairosAnime
  }, /*#__PURE__*/_react.default.createElement("img", {
    src: _OnairosBlack.default,
    alt: "Onairos Logo",
    className: "w-16 h-16 object-contain mb-2"
  }), " ", /*#__PURE__*/_react.default.createElement("span", {
    className: "whitespace-nowrap"
  }, "Connect to Onairos"), " "));
}
var _default = exports.default = Onairos;