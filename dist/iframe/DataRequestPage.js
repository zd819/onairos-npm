"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _button = require("@/components/ui/button");
var _LoadingPage = _interopRequireDefault(require("@/components/LoadingPage"));
var _UniversalOnboarding = _interopRequireDefault(require("@/components/UniversalOnboarding"));
var _IndividualConnection = _interopRequireDefault(require("./components/IndividualConnection"));
var _OnairosWhite = _interopRequireDefault(require("@/icons/OnairosWhite"));
var _api = require("../utils/api");
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// Adjust import path as needed
// Adjust import path as needed
// Adjust import path as needed
// Updated import path
// Adjust import path as needed
// Adjust import path as needed

/**
 * DataRequestPage Component
 * Displays different data requests and handles user interactions
 */const DataRequestPage = _ref => {
  let {
    requestData = {},
    dataRequester = 'App',
    proofMode = false,
    domain = ''
  } = _ref;
  const [loading, setLoading] = (0, _react.useState)(true);
  const [activeModels, setActiveModels] = (0, _react.useState)([]);
  const [granted, setGranted] = (0, _react.useState)(0);
  const [allowSubmit, setAllowSubmit] = (0, _react.useState)(false);
  const [avatar, setAvatar] = (0, _react.useState)(false);
  const [traits, setTraits] = (0, _react.useState)(false);
  const [selectedRequests, setSelectedRequests] = (0, _react.useState)({});
  const selectedConnections = (0, _react.useRef)([]);
  const hashedOthentSub = (0, _react.useRef)(null);
  const encryptedUserPin = (0, _react.useRef)(null);

  // Update allowSubmit when granted changes
  (0, _react.useEffect)(() => {
    if (granted > 0) {
      setAllowSubmit(true);
    } else {
      setAllowSubmit(false);
    }
  }, [granted]);

  // Simulate loading data
  (0, _react.useEffect)(() => {
    // In a real implementation, this would fetch active models from a service
    const loadData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Sample active models - this would come from your backend
        setActiveModels(['Personality']);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    loadData();

    // Message handler to receive data from parent window
    const handleMessage = event => {
      if (event.data && event.data.type === 'dataRequest') {
        // Process received data
        if (event.data.requestData) {
          // Update request data state
        }
        if (event.data.activeModels) {
          setActiveModels(event.data.activeModels);
        }
        if (event.data.hashedOthentSub) {
          hashedOthentSub.current = event.data.hashedOthentSub;
        }
        if (event.data.encryptedUserPin) {
          encryptedUserPin.current = event.data.encryptedUserPin;
        }
      }
    };

    // Add message listener
    window.addEventListener('message', handleMessage);

    // Clean up listener
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  /**
   * Reject all data requests
   */
  async function rejectDataRequest() {
    window.top.postMessage({
      type: 'closeIframe'
    }, '*');
    window.postMessage({
      type: 'closeIframe'
    }, '*');
    // await RejectDataRequest();
  }

  /**
   * Send the selected data requests to the parent window
   */
  async function sendDataRequest() {
    if (granted === 0) {
      window.close();
      return;
    } else {
      const SignMessage = {
        message: 'Confirm ' + dataRequester + ' Data Access',
        confirmations: selectedConnections.current
      };
      // console.log("User Granted Data Access : ", selectedConnections.current);

      // Potentially Sign With Othent
      // chrome.runtime.sendMessage({
      //   source: 'dataRequestPage',
      //   type: 'sign_acccess',
      //   SignMessage: SignMessage,
      //   confirmations: selectedConnections.current
      // }); 

      // Reply with API URL and User Authorized Data
      try {
        (0, _api.getAPIAccess)({
          proofMode: proofMode,
          Web3Type: "Othent",
          Confirmations: selectedConnections.current,
          EncryptedUserPin: encryptedUserPin.current,
          Domain: domain,
          OthentSub: hashedOthentSub.current
        }).then(response => {
          chrome.runtime.sendMessage({
            source: 'dataRequestPage',
            type: 'returnedAPIurl',
            APIurl: response.body.apiUrl,
            accessToken: response.body.token,
            approved: selectedConnections.current
          }).then(data => {
            // window.top.postMessage({type: 'closeIframe'}, '*');
            // window.postMessage({type: 'closeIframe'}, '*'); 
          });
        }).finally(() => {
          // window.top.postMessage({type: 'closeIframe'}, '*');
          // window.postMessage({type: 'closeIframe'}, '*');            
        });
      } catch (error) {
        console.error("Error sending data request:", error);
        window.close();
      }
    }
  }

  /**
   * Update the granted count
   */
  function changeGranted(plusMinus) {
    setGranted(granted + plusMinus);
  }

  /**
   * Handle selection of a connection/data request
   */
  function handleConnectionSelection(dataRequester, modelType, index, title, reward, isSelected) {
    const newDate = new Date();
    const newConnection = {
      requester: dataRequester,
      date: newDate.toISOString(),
      name: title,
      reward: reward,
      data: modelType
    };
    if (isSelected) {
      console.log(`Adding connection: ${JSON.stringify(newConnection)}`);
      if (!selectedConnections.current.find(connection => connection.requester === dataRequester && connection.data === modelType)) {
        selectedConnections.current.push(newConnection);
      }
    } else {
      console.log(`Removing connection for: ${modelType}`);
      selectedConnections.current = selectedConnections.current.filter(connection => !(connection.requester === dataRequester && connection.data === modelType));
    }
    console.log('Current selected connections:', selectedConnections.current);
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: "min-h-screen bg-gray-50",
    children: loading ? /*#__PURE__*/(0, _jsxRuntime.jsx)(_LoadingPage.default, {
      theme: "black"
    }) : activeModels.length === 0 ?
    /*#__PURE__*/
    // <NoModelPage />
    (0, _jsxRuntime.jsx)(_UniversalOnboarding.default, {
      appIcon: _OnairosWhite.default,
      appName: dataRequester
    }) : /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "max-w-md mx-auto p-4 space-y-2",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("header", {
        className: "border space-y-4 bg-white p-4 rounded-lg outline-2 outline-black/10 shadow-sm",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("h1", {
          className: "text-lg font-bold text-black",
          children: ["Data Requests from ", dataRequester]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center justify-between gap-4",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_button.Button, {
            variant: "outline",
            onClick: rejectDataRequest,
            className: "border w-full border-2 border-black/10 hover:bg-gray-50 text-black font-medium",
            children: "Reject All"
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)(_button.Button, {
            disabled: !allowSubmit,
            onClick: sendDataRequest,
            className: "w-full bg-black hover:bg-black/90 text-white font-medium",
            children: ["Confirm (", granted, ")"]
          })]
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "space-y-2",
        children: activeModels.length === 0 ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col items-center justify-center p-8 space-y-4 rounded-lg bg-white border-2 border-black/10",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            src: _OnairosWhite.default || "/placeholder.svg",
            alt: "Logo",
            className: "w-20 h-20"
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
            className: "text-center text-sm text-black/70",
            children: ["Please connect", " ", /*#__PURE__*/(0, _jsxRuntime.jsx)("a", {
              href: "https://onairos.uk/connections",
              className: "text-black font-medium hover:underline",
              children: "Onairos"
            }), " ", "Personality to send ", dataRequester, " your data"]
          })]
        }) : Object.keys(requestData).sort((a, b) => {
          const aIsActive = activeModels.includes(requestData[a].type);
          const bIsActive = activeModels.includes(requestData[b].type);
          if (requestData[a].type === "Avatar") return 1;
          if (requestData[b].type === "Avatar") return -1;
          if (requestData[b].type === "Traits") return 1;
          if (requestData[a].type === "Traits") return -1;
          if (aIsActive && !bIsActive) return -1;
          if (bIsActive && !aIsActive) return 1;
          return 0;
        }).map((key, index) => {
          const product = requestData[key];
          const active = product.type === "Personality" ? activeModels.includes(product.type) : product.type === "Avatar" ? avatar : product.type === "Traits" ? traits : false;
          return /*#__PURE__*/(0, _jsxRuntime.jsx)(_IndividualConnection.default, {
            active: active,
            title: product.type,
            id: product,
            number: index,
            descriptions: product.descriptions,
            rewards: product.reward,
            size: key,
            changeGranted: changeGranted,
            onSelectionChange: isSelected => handleConnectionSelection(dataRequester, key, index, product.type, product.reward, isSelected)
          }, key);
        })
      })]
    })
  });
};
var _default = exports.default = DataRequestPage;