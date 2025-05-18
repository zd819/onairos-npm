"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _MobileIndividualConnection = _interopRequireDefault(require("./components/MobileIndividualConnection"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * MobileDataRequestPage Component
 * Mobile-optimized version of DataRequestPage for React Native environment
 */const MobileDataRequestPage = _ref => {
  let {
    requestData = {},
    dataRequester = 'App',
    proofMode = false,
    domain = '',
    onComplete,
    onCancel
  } = _ref;
  const [loading, setLoading] = (0, _react.useState)(true);
  const [activeModels, setActiveModels] = (0, _react.useState)([]);
  const [granted, setGranted] = (0, _react.useState)(0);
  const [allowSubmit, setAllowSubmit] = (0, _react.useState)(false);
  const selectedConnections = (0, _react.useRef)([]);

  // Update allowSubmit when granted changes
  (0, _react.useEffect)(() => {
    setAllowSubmit(granted > 0);
  }, [granted]);

  // Simulate loading data
  (0, _react.useEffect)(() => {
    const loadData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Set sample data for mobile
        setActiveModels(requestData?.activeModels || ['Personality', 'Demographics']);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [requestData]);

  /**
   * Reject all data requests
   */
  function rejectDataRequest() {
    if (onCancel && typeof onCancel === 'function') {
      onCancel();
    }
  }

  /**
   * Send the selected data requests to the parent window
   */
  function sendDataRequest() {
    if (granted === 0) {
      rejectDataRequest();
      return;
    }

    // Create API response with the updated URL
    const apiResponse = {
      success: true,
      apiUrl: "https://api2.onairos.uk/inferenceTest",
      approvedRequests: selectedConnections.current
    };

    // Call onComplete with API response
    if (onComplete && typeof onComplete === 'function') {
      onComplete(apiResponse);
    }
  }

  /**
   * Update the granted count
   */
  function changeGranted(plusMinus) {
    setGranted(prev => prev + plusMinus);
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
      // Add to selected connections if not already present
      if (!selectedConnections.current.find(connection => connection.requester === dataRequester && connection.data === modelType)) {
        selectedConnections.current = [...selectedConnections.current, newConnection];
      }
    } else {
      // Remove from selected connections
      selectedConnections.current = selectedConnections.current.filter(connection => !(connection.requester === dataRequester && connection.data === modelType));
    }
  }

  // Main render
  if (loading) {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "mobile-loading-container",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "mobile-loading-spinner"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
        className: "mobile-loading-text",
        children: "Loading..."
      })]
    });
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "mobile-data-request-container",
    style: {
      height: '60vh'
    },
    children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "mobile-data-request-header",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("h2", {
        className: "mobile-data-request-title",
        children: ["Data Requests from ", dataRequester]
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "mobile-data-request-button-row",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
          className: "mobile-reject-button",
          onClick: rejectDataRequest,
          children: "Reject All"
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
          className: "mobile-confirm-button",
          disabled: !allowSubmit,
          onClick: sendDataRequest,
          children: ["Confirm (", granted, ")"]
        })]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "mobile-data-request-content",
      children: activeModels.length === 0 ? /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "mobile-no-models-message",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
          children: ["Please connect Onairos Personality to send ", dataRequester, " your data"]
        })
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "mobile-connections-list",
        children: Object.keys(requestData).filter(key => requestData[key]).map((key, index) => {
          const product = requestData[key];
          const active = activeModels.includes(product.type);
          return /*#__PURE__*/(0, _jsxRuntime.jsx)(_MobileIndividualConnection.default, {
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
      })
    })]
  });
};
var _default = exports.default = MobileDataRequestPage;