"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
var _OnairosBlack = _interopRequireDefault(require("./OnairosBlack.png"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function Onairos() {
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
    console.log("Sending Data to Extension");

    // Title here has to match a model in the Users : accountInfo.AccountInfo.models
    // Prepare the data to be sent
    const dataToSend = {
      interestModel: {
        title: 'Interest',
        books: '',
        descriptions: '',
        reward: "10% Discount"
      },
      personalityModel: {
        title: 'Personality',
        books: '',
        descriptions: '',
        reward: "2 USDC"
      },
      intelectModel: {
        title: 'Intellect',
        books: '',
        descriptions: '',
        reward: "2 USDC"
      }
    };
    const access_token = "access_token";
    // Send the data to the content script
    window.postMessage({
      source: 'bookstore',
      type: 'GET_API_URL'
    }, '*');
    window.postMessage({
      source: 'webpage',
      type: 'GET_API_URL',
      webpage: 'proxy book store',
      access_token: access_token,
      account: "ConnectedAccountRef.current",
      //No Longer needed, REMOVE
      requestData: dataToSend
    });
    // chrome.runtime.sendMessage({ source: 'bookstore', type: 'GET_API_URL'});
  };

  return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("button", {
    className: "OnairosConnect flex flex-col items-center justify-center text-white font-bold py-2 px-4 rounded cursor-pointer",
    onClick: OnairosAnime
  }, /*#__PURE__*/_react.default.createElement("img", {
    src: _OnairosBlack.default,
    alt: "Onairos Logo",
    className: "w-10 h-10 mb-2"
  }), /*#__PURE__*/_react.default.createElement("span", null, "Connect to Onairos")));
}
var _default = exports.default = Onairos;