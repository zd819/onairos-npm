"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Onairos = Onairos;
var _react = _interopRequireWildcard(require("react"));
var _kms = require("@othent/kms");
var _RSA = require("./RSA");
var _getPin = _interopRequireDefault(require("./getPin"));
var _overlay = _interopRequireDefault(require("./overlay/overlay"));
var _google = require("@react-oauth/google");
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; } // import {connect, decrypt} from '@othent/kms';
// import sha256 from 'crypto-js/sha256';
// import { Buffer } from 'buffer';
// Dynamic import for crypto-js's sha256
const loadSha256 = async () => {
  const module = await Promise.resolve().then(() => _interopRequireWildcard(require( /* webpackChunkName: "sha256" */'crypto-js/sha256')));
  return module.default;
};

// // Dynamic import for @othent/kms
// const loadOthentKms = async () => {
//   try{
//     console.log("Entering Dynamic Othent Load")
//     const module = await import(/* webpackChunkName: "othent-kms" */ '@othent/kms');
//     console.log("DYNAMICALLY LOADED OTHENT")
//     return module;
//   }catch(e){
//     console.error("Error loading Othent DYnamically : ", e)
//   }
// };

// import Buffer
function Onairos(_ref) {
  let {
    requestData,
    webpageName,
    inferenceData = null,
    onComplete = null,
    autoFetch = true,
    // Added
    proofMode = false,
    textLayout = 'below',
    textColor = 'white',
    login = false,
    buttonType = 'pill',
    loginReturn = null,
    loginType = 'signIn',
    // New prop: signIn, signUp, signOut
    visualType = 'full' // New prop: full, icon, textOnly
  } = _ref;
  const [userData, setUserData] = (0, _react.useState)(null);
  const [showOverlay, setShowOverlay] = (0, _react.useState)(false);
  const [activeModels, setActiveModels] = (0, _react.useState)([]);
  const [granted, setGranted] = (0, _react.useState)(0);
  const [selectedRequests, setSelectedRequests] = (0, _react.useState)({});
  const [avatar, setAvatar] = (0, _react.useState)(false);
  const [traits, setTraits] = (0, _react.useState)(false);
  const [othent, setOthent] = (0, _react.useState)(false);
  const [othentConnected, setOthentConnected] = (0, _react.useState)(false);
  const NoAccount = (0, _react.useRef)(false);
  const NoModel = (0, _react.useRef)(false);
  const [isAuthenticated, setIsAuthenticated] = (0, _react.useState)(false);
  const [authToken, setAuthToken] = (0, _react.useState)(null);
  const [loading, setLoading] = (0, _react.useState)(true);
  const [hashedOthentSub, setHashedOthentSub] = (0, _react.useState)(null);
  const [encryptedPin, setEncryptedPin] = (0, _react.useState)(null);
  const [authDialog, setAuthDialog] = (0, _react.useState)({
    show: false,
    type: null,
    data: null
  });
  const [accountInfo, setAccountInfo] = (0, _react.useState)(null);
  const [isLoading, setIsLoading] = (0, _react.useState)(false);
  const [isProcessingAuth, setIsProcessingAuth] = (0, _react.useState)(false);
  const hasProcessedCallback = (0, _react.useRef)(false);
  const [authError, setAuthError] = (0, _react.useState)(null);
  const [notif, setNotif] = (0, _react.useState)({
    show: false,
    color: null,
    message: null
  });
  const API_URL = 'https://api2.onairos.uk';
  // const API_URL = 'http://localhost:8080';

  // Modified useEffect for callback handling
  (0, _react.useEffect)(() => {
    const handleCallback = async () => {
      const callbackURL = new URL(window.location.href);
      const code = callbackURL.searchParams.get("code");
      const state = callbackURL.searchParams.get("state");

      // Only show dialog and process if we have both code and state
      if (code && state) {
        // Set dialog first
        // setAuthDialog({
        //   show: true,
        //   type: 'callback',
        //   data: {
        //     code,
        //     state
        //   }
        // });

        // Then process if not already processing
        if (!hasProcessedCallback.current && !isProcessingAuth) {
          hasProcessedCallback.current = true;
          setIsProcessingAuth(true);
          try {
            await completeAuth(callbackURL.toString());
            setOthentConnected(true);
            // Clear URL parameters only after successful processing
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (error) {
            console.error("Auth callback processing failed:", error);
            setAuthError(error.message);
          } finally {
            setIsProcessingAuth(false);
          }
        }
      }
    };
    handleCallback();
  }, []); // Remove isProcessingAuth dependency as we handle it inside

  const completeAuth = async callbackURL => {
    try {
      const appInfo = {
        name: "Onairos",
        version: "1.0.0",
        env: "production"
      };
      // setAuthDialog({
      //   show: true,
      //   type: 'callback',
      //   data: {
      //     code: callbackURL,
      //     state: 'Completing Callback'
      //   }
      // });
      const othent = new _kms.Othent({
        appInfo,
        throwErrors: true,
        // Enable error throwing for better error handling
        auth0LogInMethod: "redirect",
        auth0RedirectURI: window.location.href,
        auth0ReturnToURI: window.location.href
      });
      // Complete authentication using the callback URL with code and state params
      const userDetails = await othent.completeConnectionAfterRedirect(callbackURL);
      // setAuthDialog({
      //   show: true,
      //   type: 'callback',
      //   data: {
      //     code: userDetails.email,
      //     state: 'approved'
      //   }
      // });
      // Add error handling for Othent initialization
      if (!othent) {
        throw new Error("Failed to initialize Othent");
      }
      if (!userDetails || !userDetails.sub) {
        throw new Error("Invalid user details received from Othent");
      }
      setIsAuthenticated(true);
      const sha256 = await loadSha256();
      const hashedOthentSub = sha256(userDetails.sub).toString();
      setHashedOthentSub(hashedOthentSub);
      const userOnairosPin = await (0, _getPin.default)(hashedOthentSub);
      setEncryptedPin(userOnairosPin.result);
      setAuthToken(userOnairosPin.token);
      // Wait for account info before showing overlay
      await fetchAccountInfo(userDetails.email, true);
      setShowOverlay(true);

      // Store Othent token
      localStorage.setItem('othentToken', hashedOthentSub);
      localStorage.setItem('onairosToken', userDetails.token); // If Othent provides a token
    } catch (error) {
      setNotif({
        show: true,
        color: 'red',
        message: 'An error has occured, please try again'
      });
      // setAuthDialog({
      //   show: true,
      //   type: 'auth',
      //   data: {
      //     success: false,
      //     error: error.message
      //   }
      // });
      console.error("Authentication failed:", error);
      throw error; // Rethrow for the useEffect to handle
    }
  };

  // Add error display
  (0, _react.useEffect)(() => {
    if (authError) {
      // Show error to user (implement your error UI here)
      console.error("Authentication error:", authError);
    }
  }, [authError]);
  const isMobileDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|iphone|ipad|ipod|windows phone/i.test(userAgent);
  };
  const isTelegramMiniApp = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return typeof window.Telegram !== 'undefined' && /telegram/i.test(userAgent) && /mobile/i.test(navigator.userAgent);
  };
  const findLargestDataObject = arrayOfObjects => {
    // Update the hierarchy
    const hierarchy = {
      'Small': 16,
      'Medium': 32,
      'Large': 64
    };
    let largestObject = null;
    let largestValue = 0;
    arrayOfObjects.forEach(obj => {
      const currentValue = hierarchy[obj.data];
      if (currentValue > largestValue) {
        largestValue = currentValue;
        largestObject = obj;
      }
    });
    return largestValue;
  };
  (0, _react.useEffect)(() => {
    // Only proceed if autoFetch is true and onComplete is a function
    if (autoFetch && inferenceData && typeof onComplete === 'function') {
      const handleAPIResponse = async event => {
        if (event.data && event.data.source === 'content-script' && event.data.type === 'API_URL_RESPONSE' && event.data.unique === "Onairos-Response") {
          const {
            APIurl,
            approved,
            accessToken
          } = event.data;
          const trimSize = findLargestDataObject(approved);
          // Trim the data array based on the allowed number of items
          const trimmedData = inferenceData.slice(0, trimSize);
          // Fetch the new anime data from the API URL
          const jsonData = {
            Input: trimmedData // Your request payload
          };
          try {
            const response = await fetch(APIurl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              },
              body: JSON.stringify(jsonData)
            });
            const data = await response.json();
            onComplete(data);
          } catch (error) {
            console.error(error);
            onComplete(null, error);
          }
        }
      };
      window.addEventListener('message', handleAPIResponse);
      return () => {
        window.removeEventListener('message', handleAPIResponse);
      };
    }
  }, []);
  const generateRandomData = structure => {
    const generateRandomNumbers = obj => {
      if (Array.isArray(obj)) {
        return obj.map(item => generateRandomNumbers(item));
      } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
          acc[key] = generateRandomNumbers(obj[key]);
          return acc;
        }, {});
      } else {
        return Math.random();
      }
    };
    return generateRandomNumbers(structure);
  };
  const handleConnectionSelection = (dataRequester, key, index, type, reward, isSelected) => {
    setSelectedRequests(prev => ({
      ...prev,
      [`${dataRequester}-${key}-${index}`]: {
        type,
        reward,
        isSelected
      }
    }));
  };
  const changeGranted = value => {
    setGranted(prev => prev + value);
  };
  const handleAPIRequestForMobile = async () => {
    if (isMobileDevice()) {
      setShowOverlay(true);
    }
    return;
  };
  const rejectDataRequest = () => {
    setShowOverlay(false);
    if (onComplete) {
      onComplete('rejected');
    }
  };
  const sendDataRequest = async () => {
    if (granted > 0) {
      try {
        if (othent && !othentConnected) {
          setAuthDialog({
            show: true,
            type: 'callback',
            data: {
              code: "Connecting Othent Details",
              state: ""
            }
          });
          const appInfo = {
            name: "Onairos",
            version: "1.0.0",
            env: "production"
          };
          const othent = new _kms.Othent({
            appInfo,
            throwErrors: false
          });
          // Get User Othent Secure Details
          const userDetails = await othent.connect();
          const sha256 = await loadSha256();
          const hashedOthentSub = sha256(userDetails.sub).toString();
          setHashedOthentSub(hashedOthentSub);
          const encryptedPin = await (0, _getPin.default)(hashedOthentSub);
          setEncryptedPin(encryptedPin.result);
          setAuthToken(encryptedPin.token);
          setOthentConnected(true);
        }
        const approvedRequests = Object.values(selectedRequests).filter(req => req.isSelected).map(req => ({
          type: req.type,
          reward: req.reward
        }));
        setAuthDialog({
          show: true,
          type: 'callback',
          data: {
            code: "Retrieving API URL",
            state: approvedRequests
          }
        });
        const jsonData = {
          Info: {
            'EncryptedUserPin': encryptedPin,
            'confirmations': approvedRequests,
            'web3Type': 'othent',
            'Domain': window.location.href,
            'proofMode': 'false',
            'OthentSub': hashedOthentSub
          }
        };
        // Similar to existing autoFetch logic but for mobile
        try {
          const response = await fetch('https://api2.onairos.uk/getAPIurl', {
            // return await fetch('http://localhost:8080/getAPIurl', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
          });
          const data = await response.json();
          if (autoFetch && onComplete) {
            onComplete(data);
          } else {
            setAuthDialog({
              show: true,
              type: 'apiURL',
              data: {
                code: response.body.apiUrl,
                state: approved
              }
            });
            chrome.runtime.sendMessage({
              source: 'dataRequestPage',
              type: 'returnedAPIurl',
              APIurl: response.body.apiUrl,
              accessToken: response.body.token,
              approved: selectedConnections.current
            });
          }
        } catch (error) {
          console.error(error);
          if (onComplete) {
            onComplete(null, error);
          }
        }
      } catch (error) {
        console.error(error);
      }
      setShowOverlay(false);
    }
    ;
  };
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
  const checkOnairosExtension = () => {
    if (typeof window.onairos !== 'undefined') {
      console.log('Onairos info:', window.onairos.getInfo());
    } else {
      console.log('Onairos is not installed.');
    }
    // Or listen for the onairosReady event
    window.addEventListener('onairosReady', function () {
      console.log('Onairos was just detected!');
    });
    return typeof window.onairos !== 'undefined';
  };
  const validateDomain = async () => {
    // Your logic to validate the domain goes here
    // For example, you could make an API request to your backend
    return fetch('https://api2.onairos.uk/valid/validate-domain', {
      // return fetch('http://localhost:8080/valid/validate-domain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(r => r.json().then(data => ({
      status: r.status,
      body: data
    }))).catch(error => console.error(error));
  };
  const OnairosChecks = async () => {
    if (checkOnairosExtension()) {
      // The extension is installed
      // Proceed with the domain validation request or any other logic
      if ((await validateDomain()).body.status) {
        // Valid Domain
        // Proceed with the domain validation request or any other logic
        try {
          validateRequestData();
          await ConnectOnairos();
        } catch (error) {
          // Handle any errors here
          console.error("Error connecting to Onairos", error);
        }
      } else {
        console.error("Please make sure this is an Onairos Partnered app");
      }
    } else {
      // The extension is not installed
      // Open the Chrome Web Store page to download the extension
      window.open('https://chromewebstore.google.com/detail/onairos/apkfageplidiblifhnadehmplfccapkf', '_blank');
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
  const ConnectOnairos = async () => {
    try {
      if (isMobileDevice()) {
        // Testing
        await handleAPIRequestForMobile();
        return;
      }
      const appInfo = {
        name: "Onairos",
        version: "1.0.0",
        env: "production"
      };
      const othent = new _kms.Othent({
        appInfo,
        throwErrors: false
      });
      // Get User Othent Secure Details
      // const { connect} = await loadOthentKms();
      const userDetails = await othent.connect();
      const sha256 = await loadSha256();
      const hashedOthentSub = sha256(userDetails.sub).toString();
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

      // const {decrypt }= await loadOthentKms();
      const userPin = await othent.decrypt(bufferPIN);
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
  };

  // Styling and button class based on visual type and login mode
  const buttonClass = `flex items-center justify-center font-bold rounded cursor-pointer ${buttonType === 'pill' ? 'px-4 py-2' : 'w-12 h-12'} ${login ? 'bg-white border border-gray-300' : 'bg-transparent'}
    ${isMobileDevice() ? '' : 'OnairosConnect'}
    `;
  const buttonStyle = {
    flexDirection: textLayout === 'below' ? 'column' : 'row',
    backgroundColor: login ? '#ffffff' : 'transparent',
    color: login ? 'black' : textColor,
    border: login ? '1px solid #ddd' : '1px solid transparent'
  };

  // Icon and text style based on the visualType
  const logoStyle = {
    width: '20px',
    height: '20px',
    marginRight: visualType === 'full' ? '12px' : '0' // Space between icon and text only in full mode
  };
  const getText = () => {
    switch (loginType) {
      case 'signUp':
        return 'Sign Up with Onairos';
      case 'signOut':
        return 'Sign Out of Onairos';
      default:
        return 'Sign In with Onairos';
    }
  };

  // Make sure you have this environment variable set
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const fetchAccountInfo = async function (identifier) {
    let isEmail = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    try {
      const jsonData = isEmail ? {
        Info: {
          identifier: identifier
        }
      } : {
        Info: {
          userName: identifier
        }
      };
      const endpoint = isEmail ? '/getAccountInfo/email' : '/getAccountInfo';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('onairosToken')}`
        },
        body: JSON.stringify(jsonData)
      });
      if (!response.ok) {
        throw new Error('Failed to fetch account info');
      }
      const data = await response.json();
      if (data.AccountInfo === "No Account Found") {
        NoAccount.current = true;
        setAccountInfo(null);
        return null;
      }
      setAccountInfo(data.AccountInfo);
      if (data.AccountInfo.models) {
        setActiveModels(data.AccountInfo.models);
      } else {
        NoModel.current = true;
      }
      if (data.AccountInfo.avatar) {
        setAvatar(true);
      }
      if (data.AccountInfo.traits) {
        setTraits(true);
      }

      // // If we have account info and models, show the overlay with data requests
      // if (data.AccountInfo && data.AccountInfo.models?.length > 0) {
      //   setShowOverlay(true);
      // }

      return data.AccountInfo;
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  };
  const checkExistingToken = async () => {
    try {
      const onairosToken = localStorage.getItem('onairosToken');
      const legacyToken = localStorage.getItem('token');
      const token = onairosToken || legacyToken;
      if (token) {
        // const response = await fetch('https://api2.onairos.uk/verifyToken', {
        const response = await fetch('http://localhost:8080/verifyToken', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            setAuthToken(token);
            setIsAuthenticated(true);
            const username = localStorage.getItem('username');
            await fetchAccountInfo(username);
          } else {
            localStorage.removeItem('onairosToken');
            localStorage.removeItem('token');
          }
        }
      }
    } catch (error) {
      console.error('Token verification failed:', error);
    } finally {
      setLoading(false);
    }
  };
  (0, _react.useEffect)(() => {
    if (isMobileDevice()) {
      checkExistingToken();
    }
  }, []);
  const handleCloseOverlay = () => {
    setGranted(0);
    setShowOverlay(false);
  };

  // Check for existing token and fetch account info on mount
  (0, _react.useEffect)(() => {
    const token = localStorage.getItem('onairosToken');
    const username = localStorage.getItem('username');
    if (token && username) {
      fetchAccountInfo(username, false);
    }
  }, []);
  const handleLoginSuccess = async function (identifier) {
    let isEmail = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    try {
      const accountData = await fetchAccountInfo(identifier, isEmail);
      // Update authentication first
      setIsAuthenticated(true);
      // Then update account info
      setShowOverlay(true);
      // setAccountInfo(accountData);
      return accountData;
    } catch (error) {
      console.error('Login process failed:', error);
      throw error;
    }
  };

  // Check for stored tokens on mount
  (0, _react.useEffect)(() => {
    const checkStoredAuth = async () => {
      const token = localStorage.getItem('onairosToken');
      const username = localStorage.getItem('username');
      const othentToken = localStorage.getItem('othentToken');
      if (token) {
        try {
          // Verify token is still valid
          const response = await fetch(`${API_URL}/verifyToken`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            setIsAuthenticated(true);
            if (username) {
              await fetchAccountInfo(username, false);
            } else if (othentToken) {
              // Handle Othent stored session
              const userDetails = JSON.parse(othentToken);
              await fetchAccountInfo(userDetails.email, true);
            }
          } else {
            // Clear invalid tokens
            localStorage.removeItem('onairosToken');
            localStorage.removeItem('username');
            localStorage.removeItem('othentToken');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
        }
      }
    };
    checkStoredAuth();
  }, []);

  // Return overlay for mobile devices when needed
  if (false && showOverlay && isMobileDevice()) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_google.GoogleOAuthProvider, {
      clientId: GOOGLE_CLIENT_ID,
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_overlay.default, {
        setOthentConnected: setOthentConnected,
        dataRequester: webpageName,
        NoAccount: NoAccount,
        NoModel: NoModel,
        accountInfo: accountInfo,
        activeModels: activeModels,
        avatar: avatar,
        traits: traits,
        requestData: requestData,
        handleConnectionSelection: handleConnectionSelection,
        changeGranted: changeGranted,
        granted: granted,
        allowSubmit: granted > 0,
        rejectDataRequest: rejectDataRequest,
        sendDataRequest: sendDataRequest,
        isAuthenticated: isAuthenticated,
        onLoginSuccess: handleLoginSuccess,
        onClose: handleCloseOverlay,
        setOthent: setOthent,
        setHashedOthentSub: setHashedOthentSub,
        setEncryptedPin: setEncryptedPin
      })
    });
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex items-center justify-center",
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
        className: buttonClass,
        onClick: ConnectOnairos,
        style: buttonStyle,
        children: [(visualType === 'full' || visualType === 'icon') && /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
          src: login ? "https://onairos.sirv.com/Images/OnairosWhite.png" : "https://onairos.sirv.com/Images/OnairosBlack.png",
          alt: "Onairos Logo",
          style: logoStyle,
          className: `${buttonType === 'pill' ? 'w-6 h-6' : 'w-8 h-8'} object-contain`
        }), (visualType === 'full' || visualType === 'textOnly') && /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: `${login ? 'text-black' : textColor === 'black' ? 'text-black' : 'text-white'} ${visualType === 'icon' ? 'sr-only' : ''} ${textLayout === 'right' ? 'ml-2' : textLayout === 'left' ? 'mr-2' : ''}`,
          children: getText()
        })]
      })
    }), notif.show && /*#__PURE__*/(0, _jsxRuntime.jsx)(Notification, {
      message: notif.message,
      color: notif.color
    }), authDialog.show &&
    /*#__PURE__*/
    // {false && 
    (0, _jsxRuntime.jsxs)("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "fixed inset-0 bg-black bg-opacity-50",
        onClick: () => setAuthDialog({
          show: false,
          type: null,
          data: null
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "relative bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
          onClick: () => setAuthDialog({
            show: false,
            type: null,
            data: null
          }),
          className: "absolute top-4 right-4 text-gray-400 hover:text-gray-600",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "sr-only",
            children: "Close"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
            className: "h-6 w-6",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: 2,
              d: "M6 18L18 6M6 6l12 12"
            })
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
          className: "text-lg font-semibold mb-4",
          children: authDialog.type === 'callback' ? 'Callback Details' : 'Authentication Result'
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
          className: "text-lg font-semibold mb-4",
          children: authDialog.type === 'apiURL' ? 'API Url Returned' : 'Authentication Result'
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "bg-gray-50 rounded p-4 overflow-x-auto",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("pre", {
            className: "text-sm",
            children: JSON.stringify(authDialog.data, null, 2)
          })
        }), authDialog.type === 'auth' && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: `mt-4 p-3 rounded ${authDialog.data?.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`,
          children: authDialog.data?.success ? 'Authentication successful!' : 'Authentication failed'
        })]
      })]
    }), isLoading && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "bg-white p-6 rounded-lg shadow-xl",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "mt-4 text-gray-600",
          children: "Loading your account..."
        })]
      })
    }), showOverlay && !isLoading && /*#__PURE__*/(0, _jsxRuntime.jsx)(_overlay.default, {
      setOthentConnected: setOthentConnected,
      dataRequester: webpageName,
      NoAccount: NoAccount,
      NoModel: NoModel,
      accountInfo: accountInfo,
      activeModels: activeModels,
      avatar: avatar,
      traits: traits,
      requestData: requestData,
      handleConnectionSelection: handleConnectionSelection,
      changeGranted: changeGranted,
      granted: granted,
      allowSubmit: granted > 0,
      rejectDataRequest: rejectDataRequest,
      sendDataRequest: sendDataRequest,
      isAuthenticated: isAuthenticated,
      onLoginSuccess: handleLoginSuccess,
      onClose: handleCloseOverlay,
      setOthent: setOthent,
      setHashedOthentSub: setHashedOthentSub,
      setEncryptedPin: setEncryptedPin
    })]
  });
}

// export default Onairos;

// module.exports = Onairos;