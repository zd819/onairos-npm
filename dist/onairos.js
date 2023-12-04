"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _OnairosBlack = _interopRequireDefault(require("./OnairosBlack.png"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function Onairos(_ref) {
  let {
    requestData,
    proofMode = false,
    webpageName
  } = _ref;
  const [token, setToken] = (0, _react.useState)();
  const OnairosAnime = async () => {
    try {
      console.log("Clicked Onairos Connect");
      await ConnectOnairos();
    } catch (error) {
      // Handle any errors here
      console.error("Error connecting to Onairos", error);
    }
  };
  const requestToken = async () => {
    const domain = window.location.hostname;
    const response = await fetch('https://api2.onairos.uk/dev/request-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        domain
      })
    });
    if (!response.ok) {
      throw new Error('Token request failed: ' + response.statusText);
    }
    const data = await response.json();
    setToken(data.token);
    // this.token = data.token; // Store the token
  };

  const ConnectOnairos = async () => {
    // Title here has to match a model in the Users : accountInfo.AccountInfo.models
    // Prepare the data to be sent
    // Send the data to the content script

    await requestToken();
    window.postMessage({
      source: 'webpage',
      type: 'GET_API_URL',
      webpageName: webpageName,
      access_token: token,
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