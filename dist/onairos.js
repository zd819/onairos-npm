"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Onairos = Onairos;
var _react = _interopRequireWildcard(require("react"));
var _OnairosBlack = _interopRequireDefault(require("./OnairosBlack.png"));
var _kms = _interopRequireDefault(require("@othent/kms"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// import * as othentKMS from '@othent/kms';

// import {connect, getActiveKey, encrypt} from '@othent/kms';
// export { default as AxiosTestComponent } from './AxiosTestComponent.js';

function Onairos(_ref) {
  let {
    requestData,
    webpageName,
    proofMode = false
  } = _ref;
  // useEffect(() => {
  //   console.log("Dynamic Othent IMport")
  //   import('@othent/kms').then(async othentKMS => {
  //     try {
  //       console.log("Dynamic Othent IMport")
  //       const userDetails = await othentKMS.connect();
  //       console.log("Othent KMS: ", userDetails);
  //     } catch (error) {
  //       console.error("Error using @othent/kms:", error);
  //     }
  //   }).catch(error => {
  //     console.error("Error importing @othent/kms:", error);
  //   });
  // }, []);

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
  const domain = window.location.href;
  const ConnectOnairos = async () => {
    let EncryptUserDetails, HashedActive;
    try {
      // Testing User Secure Details
      // const userDetails = await connect();
      // console.log("Othent KMS : ", userDetails);
      //  EncryptUserDetails = await encrypt(userDetails);; // Encrypted (Onairos Key Pair) Othent User Details Object
      // const OthentKey = await getActiveKey();
      //  HashedActive = sha256(OthentKey).toString();
      // console.log("HashedActive : ", HashedActive);
    } catch (e) {
      console.error("Othent in npm package error : ", e);
    }

    // Prepare the data to be sent
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

// // export default Onairos;

// module.exports = Onairos;
//# sourceMappingURL=onairos.js.map