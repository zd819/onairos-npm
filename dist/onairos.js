"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _OnairosBlack = _interopRequireDefault(require("./OnairosBlack.png"));
var _kms = require("@othent/kms");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// import {connect, encrypt, getActiveKey} from "@othent/kms-unbundled";
// const {connect, getActiveKey, encrypt, getActivePublicKey } = require("@othent/kms");
// const {connect, getActiveKey, encrypt, getActivePublicKey } = require("@othent/kms-unbundled");
// import * as OthentKMS from "@othent/kms";
// import connect from '@othent/kms' ;
// import  getActiveKey from '@othent/kms' ;

async function initiateOthent() {
  // const userDetails = await OthentKMS.connect();

  //   // // New Othent KMS System
  const userDetails = await (0, _kms.connect)();
  console.log("Othent KMS : ", userDetails);
  try {
    const OthentKey = await (0, _kms.getActiveKey)();
    console.log("OthentKey : ", OthentKey);
  } catch (e) {
    console.log("Error : ", e);
  }

  // async function handleEncrypt(data){
  //   const res =  await encrypt(data);
  //   console.log(`Encrypted USerdata: ${JSON.stringify(res)}, and length ${JSON.stringify(res).length}`)
  //   return res;
  // };
  // // const encryptedOthentKey = await encryptWithPublicKey(OnairosPublicKey, OthentKey);
  // // JWK Encyrpt Othent Web2 User Details, 
  // const encryptedOthentKey = await handleEncrypt(JSON.stringify(userDetails));
  // console.log("encryptedOthentKey : ", encryptedOthentKey)
}
function Onairos(_ref) {
  let {
    requestData,
    webpageName,
    proofMode = false
  } = _ref;
  // const [token,setToken] = useState('');
  const OnairosAnime = async () => {
    try {
      console.log("Clicked Onairos Connect");
      await ConnectOnairos();
    } catch (error) {
      // Handle any errors here
      console.error("Error connecting to Onairos", error);
    }
  };
  var token;
  // connect().then(
  //   (response) =>{
  //     console.log("USer Details: ", response)
  //   }
  // ).catch((e)=>{
  //   console.log("error : ", e);
  // }
  // );

  const domain = window.location.href;

  // async function requestToken(){
  //   const response = await fetch('https://api2.onairos.uk/dev/request-token', {
  //       method: 'POST',
  //       headers: {
  //           'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         domain:domain,
  //         userOthentKey:userOthentKey
  //       })
  //   });

  //   if (!response.ok) {
  //       throw new Error('Token request failed: ' + response.statusText);
  //   }

  //   const data = await response.json();
  //   token = data.token;
  //   // this.token = data.token; // Store the token
  // }

  const ConnectOnairos = async () => {
    // Title here has to match a model in the Users : accountInfo.AccountInfo.models
    // Prepare the data to be sent
    // Send the data to the content script

    // await requestToken();
    // await initiateOthent();
    const HashedActive = "HashedActive";
    const EncryptUserDetails = "EncryptUserDetails";
    window.postMessage({
      source: 'webpage',
      type: 'GET_API_URL',
      webpageName: webpageName,
      domain: domain,
      requestData: requestData,
      proofMode: proofMode,
      HashedActive: HashedActive,
      EncryptUserDetails: EncryptUserDetails
    });
  };
  return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("button", {
    className: "OnairosConnect w-20 h-20 flex flex-col items-center justify-center text-white font-bold py-2 px-4 rounded cursor-pointer",
    onClick: OnairosAnime
  }, /*#__PURE__*/_react.default.createElement("img", {
    src: "https://onairos.sirv.com/Images/OnairosBlack.png",
    alt: "Onairos Logo",
    className: "w-16 h-16 object-contain mb-2"
  }), " ", /*#__PURE__*/_react.default.createElement("span", {
    className: "whitespace-nowrap"
  }, "Connect to Onairos"), " "));
}
var _default = exports.default = Onairos;
//# sourceMappingURL=onairos.js.map