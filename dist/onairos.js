"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Onairos = Onairos;
var _react = _interopRequireDefault(require("react"));
var _sha = _interopRequireDefault(require("crypto-js/sha256"));
var _RSA = require("./RSA");
var _getPin = _interopRequireDefault(require("./getPin"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/* global __webpack_public_path__ */
__webpack_public_path__ = '/static/js/';

// import {connect, decrypt} from '@othent/kms';

// import { Buffer } from 'buffer';

// Dynamic import for crypto-js's sha256
// const loadSha256 = async () =>{
//   try{

//     console.log("loadSha256 loading ")
//     const module = await import(/* webpackChunkName: "sha256" */ 'crypto-js/sha256');
//     console.log("loadSha256 loading successful")

//     return module;
//   } catch (e) {
//       console.error("Error loading Othent:", e, e.request, e.response);
//       throw e; // Rethrow the error to be caught by the caller
//   }
// };

// Dynamic import for @othent/kms
const loadOthentKms = async () => {
  try {
    console.log("Othent dynamic loading ");
    const module = await Promise.resolve().then(() => _interopRequireWildcard(require( /* webpackChunkName: "othent-kms" */'@othent/kms')));
    console.log("Othent loading successful");
    return module;
  } catch (e) {
    console.error("Error loading Othent:", e, e.request, e.response);
    throw e; // Rethrow the error to be caught by the caller
  }
};

// import Buffer
function Onairos(_ref) {
  let {
    requestData,
    webpageName,
    proofMode = false
  } = _ref;
  const validateRequestData = () => {
    const validKeys = ['Small', 'Medium', 'Large'];
    const requiredProperties = ['type', 'descriptions', 'reward'];
    if (typeof webpageName !== 'string') {
      throw new Error(`Property webpageName must be a String`);
    }
    for (const key of validKeys) {
      if (!(key in requestData)) {
        throw new Error(`Missing key '${key}' in requestData.`);
      }
      for (const prop of requiredProperties) {
        if (!(prop in requestData[key])) {
          throw new Error(`Missing property '${prop}' in requestData.${key}.`);
        }
        if (prop !== 'reward' && typeof requestData[key][prop] !== 'string') {
          throw new Error(`Property '${prop}' in requestData.${key} must be a string.`);
        }
        if (prop !== 'reward' && requestData[key][prop].trim() === '') {
          throw new Error(`Property '${prop}' in requestData.${key} cannot be empty.`);
        }
      }
    }
    // Add any other validation rules as necessary
  };
  const OnairosAnime = async () => {
    try {
      console.log('Validating request data...');
      validateRequestData();
      console.log('Connecting to Onairos...');
      await ConnectOnairos();
      console.log('Connected to Onairos.');
    } catch (error) {
      // Handle any errors here
      console.error("Error connecting to Onairos", error);
    }
  };
  const OnairosPublicKey = `
    -----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4wkWvRPaJiY8CwQ5BoJI
    amcGAYV91Bk8NrvWq4PXM+J/RJugfgTNCYKQ/c6g4xa1YES/tJEzFS7nf0Kdoqxm
    5aav0ru5vS4fc4vCOLTI9W1T7nj02NY91rogsQm2/KMxUQ8DaLeTZKi+0Wjsa9YO
    6XGGd1wh4azgQkj04MWW5J1EBCcBavKoY+C85oA9jkkklQ8nGWgbugmZs7eXHNQb
    qH8/ZHcB9Kx1CZ6XjQuVd6YE/A+swV+DksbkXANcYjr6SY/2TbB8GfpcOMM3bkyN
    Q8e0A51q5a8abfuAkDZXe67MwKMWu/626abwPZhJrKr5HhRZZDwPtnXlktYHhOK6
    lQIDAQAB
    -----END PUBLIC KEY-----
      `;
  const domain = window.location.href;
  async function ConnectOnairos() {
    try {
      // console.log("Trying SHa")
      // const sha2562 = await loadSha256().then(()=>{
      //   console.log("Othent LOADED In PROMISE")

      // });

      // Get User Othent Secure Details
      const othentKms = await loadOthentKms();
      const {
        connect
      } = othentKms;
      console.log("Othent LOADED MOVING ON");
      const userDetails = await connect();
      // console.log("userDetails : ", hashedOthentSub);
      // const sha256 = (await loadSha256()).default;
      const hashedOthentSub = (0, _sha.default)(userDetails.sub).toString();
      const encryptedPin = await (0, _getPin.default)(hashedOthentSub);
      function convertToBuffer(string) {
        try {
          // Decode base64 string
          const encodedData = window.atob(string);
          const uint8Array = new Uint8Array(encodedData.length);
          for (let i = 0; i < encodedData.length; i++) {
            uint8Array[i] = encodedData.charCodeAt(i);
          }
          return uint8Array.buffer; // This is an ArrayBuffer
        } catch (e) {
          console.error("Error converting to Buffer :", e);
        }
      }
      const bufferPIN = convertToBuffer(encryptedPin.result);

      // console.log("bufferPIN : ", bufferPIN);

      const {
        decrypt
      } = await loadOthentKms();
      const userPin = await decrypt(bufferPIN);

      // RSA Encrypt the PIN to transmit to Terminal and backend
      (0, _RSA.rsaEncrypt)(OnairosPublicKey, userPin).then(encryptedData => {
        // Prepare the data to be sent
        window.postMessage({
          source: 'webpage',
          type: 'GET_API_URL',
          webpageName: webpageName,
          domain: domain,
          requestData: requestData,
          proofMode: proofMode,
          HashedOthentSub: hashedOthentSub,
          EncryptedUserPin: encryptedData
        });
      }).catch(error => {
        console.error("Encryption failed:", error);
      });
    } catch (e) {
      console.error({
        fix: "Please ensure you have stored your model"
      });
      console.error("Error Sending Data to Terminal: ", e);
    }
  }
  ;
  return /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("button", {
    className: "OnairosConnect w-20 h-20 flex flex-col items-center justify-center text-white font-bold py-2 px-4 rounded cursor-pointer",
    onClick: async () => {
      console.log('Button clicked');
      await OnairosAnime();
    }
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