"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Overlay;
var _react = require("react");
var _google = require("@react-oauth/google");
var _jwtDecode = require("jwt-decode");
var _AuthButtons = _interopRequireDefault(require("../components/AuthButtons"));
var _IndividualConnection = _interopRequireDefault(require("./IndividualConnection"));
var _SecuritySetup = _interopRequireDefault(require("../components/SecuritySetup"));
var _UniversalOnboarding = _interopRequireDefault(require("../components/UniversalOnboarding"));
var _SignUp = _interopRequireDefault(require("../components/SignUp"));
var _jsxRuntime = require("react/jsx-runtime");
function Overlay(_ref) {
  let {
    setOthentConnected,
    dataRequester,
    NoAccount,
    NoModel,
    activeModels,
    avatar,
    setAvatar,
    traits,
    setTraits,
    requestData,
    handleConnectionSelection,
    changeGranted,
    granted,
    allowSubmit,
    rejectDataRequest,
    sendDataRequest,
    isAuthenticated,
    onClose,
    onLoginSuccess,
    setOthent,
    setHashedOthentSub,
    setEncryptedPin,
    accountInfo
  } = _ref;
  const [loginError, setLoginError] = (0, _react.useState)(null);
  const [loading, setLoading] = (0, _react.useState)(false);
  const overlayRef = (0, _react.useRef)(null);
  const [currentView, setCurrentView] = (0, _react.useState)(() => {
    if (isAuthenticated) {
      if (accountInfo && accountInfo.models?.length > 0) {
        return 'datarequests';
      }
      return 'onboarding';
    }
    return 'login';
  });
  const [formData, setFormData] = (0, _react.useState)({
    username: '',
    password: ''
  });
  const [loginCompleted, setLoginCompleted] = (0, _react.useState)(false);
  const API_URL = 'https://api2.onairos.uk';

  // Set dynamic viewport height
  (0, _react.useEffect)(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);
  const handleClose = () => {
    onClose();
  };

  // Handle click outside
  (0, _react.useEffect)(() => {
    const handleClickOutside = event => {
      if (overlayRef.current && !overlayRef.current.contains(event.target)) {
        handleClose?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [handleClose]);
  const handleGoogleSuccess = async credentialResponse => {
    try {
      setLoginError(null);
      const decoded = (0, _jwtDecode.jwtDecode)(credentialResponse.credential);
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
          email: decoded.email
        })
      });
      if (!response.ok) {
        throw new Error('Google authentication failed');
      }
      const {
        token
      } = await response.json();
      localStorage.setItem('onairosToken', token);
      await handleLoginSuccess(decoded.email, true);
    } catch (error) {
      console.error('Google login failed:', error);
      setLoginError('Google login failed. Please try again.');
    }
  };
  const handleInputChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleOnairosLogin = async e => {
    e.preventDefault();
    try {
      setLoginError(null);
      const loginAttempt = {
        details: {
          username: formData.username,
          password: formData.password
        }
      };
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginAttempt)
      });
      const data = await response.json();
      if (data.authentication === 'Accepted') {
        localStorage.setItem('onairosToken', data.token);
        localStorage.setItem('username', formData.username);
        await handleLoginSuccess(formData.username);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('Invalid username or password');
    }
  };
  const handleLoginSuccess = async function (identifier) {
    let isEmail = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    setLoading(true);
    try {
      const result = await onLoginSuccess(identifier, isEmail);
      setLoginError(null);
    } catch (error) {
      console.error('Login process failed:', error);
      setLoginError('Failed to complete login process');
    } finally {
      setLoading(false);
    }
  };
  const handleOnboardingComplete = () => {
    setCurrentView('security');
  };
  const handleSecurityComplete = securityDetails => {
    // Handle security setup completion
    if (securityDetails.method === 'othent') {
      setOthent(true);
    } else if (securityDetails.method === 'pin') {
      setEncryptedPin(securityDetails.value);
    }
    setCurrentView('datarequests');
  };
  const DataRequestsSection = _ref2 => {
    let {
      dataRequester,
      granted,
      allowSubmit,
      rejectDataRequest,
      sendDataRequest,
      activeModels,
      requestData,
      handleConnectionSelection,
      changeGranted,
      avatar,
      traits
    } = _ref2;
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex flex-col h-full",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "px-6",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("h1", {
          className: "text-lg font-semibold text-gray-900 mb-6",
          children: ["Data Requests from ", dataRequester]
        }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center justify-between mb-6",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            className: "bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-8 rounded-full",
            onClick: rejectDataRequest,
            children: "Reject All"
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
            disabled: !allowSubmit || granted === 0,
            className: `${allowSubmit && granted > 0 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'} text-white font-bold py-2 px-8 rounded-full`,
            onClick: sendDataRequest,
            children: ["Confirm (", granted, ")"]
          })]
        })]
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex-1 overflow-y-auto px-6",
        children: activeModels.length === 0 ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col items-center justify-center py-8",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            src: "https://onairos.sirv.com/Images/OnairosWhite.png",
            alt: "Onairos Logo",
            className: "w-24 h-24 mb-4"
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
            className: "text-center text-gray-800 font-medium",
            children: ["Please connect ", /*#__PURE__*/(0, _jsxRuntime.jsx)("a", {
              href: "https://onairos.uk/connections",
              className: "text-blue-500 hover:underline",
              children: "Onairos"
            }), " Personality to send ", dataRequester, " your data"]
          })]
        }) : /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "space-y-4",
          children: Object.keys(requestData).sort((a, b) => {
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
            const active = product.type === 'Personality' ? activeModels.includes(product.type) : product.type === 'Avatar' ? avatar : product.type === 'Traits' ? traits : false;
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
        })
      })]
    });
  };
  const renderContent = () => {
    switch (currentView) {
      case 'signup':
        return /*#__PURE__*/(0, _jsxRuntime.jsx)(_SignUp.default, {
          onSignUpSuccess: handleLoginSuccess,
          setOthent: setOthent,
          setHashedOthentSub: setHashedOthentSub,
          setEncryptedPin: setEncryptedPin
        });
      case 'onboarding':
        return /*#__PURE__*/(0, _jsxRuntime.jsx)(_UniversalOnboarding.default, {
          onComplete: handleOnboardingComplete
        });
      case 'security':
        return /*#__PURE__*/(0, _jsxRuntime.jsx)(_SecuritySetup.default, {
          onComplete: handleSecurityComplete
        });
      case 'datarequests':
        return /*#__PURE__*/(0, _jsxRuntime.jsx)(DataRequestsSection, {
          dataRequester: dataRequester,
          granted: granted,
          allowSubmit: allowSubmit,
          rejectDataRequest: rejectDataRequest,
          sendDataRequest: sendDataRequest,
          activeModels: activeModels,
          requestData: requestData,
          handleConnectionSelection: handleConnectionSelection,
          changeGranted: changeGranted,
          avatar: avatar,
          traits: traits
        });
      default:
        return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex flex-col items-center justify-start max-w-sm mx-auto space-y-6 pt-4",
          children: [loginError && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg",
            children: loginError
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_AuthButtons.default, {
            onLoginSuccess: handleLoginSuccess,
            setOthent: setOthent,
            setHashedOthentSub: setHashedOthentSub,
            setEncryptedPin: setEncryptedPin
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "w-full flex items-center justify-center space-x-4",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("hr", {
              className: "flex-grow border-gray-300"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
              className: "text-gray-500",
              children: "or"
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("hr", {
              className: "flex-grow border-gray-300"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("form", {
            onSubmit: handleOnairosLogin,
            className: "w-full space-y-4",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
              type: "text",
              name: "username",
              value: formData.username,
              onChange: handleInputChange,
              placeholder: "Username",
              className: "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
              required: true
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
              type: "password",
              name: "password",
              value: formData.password,
              onChange: handleInputChange,
              placeholder: "Password",
              className: "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
              required: true
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
              type: "submit",
              className: "w-full bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors",
              children: "Sign In"
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
            onClick: () => setCurrentView('signup'),
            className: "w-full text-center text-blue-500 hover:text-blue-600",
            children: "Don't have an account? Sign up"
          })]
        });
    }
  };
  (0, _react.useEffect)(() => {
    if (isAuthenticated && accountInfo) {
      if (accountInfo.models?.length > 0) {
        setCurrentView('datarequests');
      } else {
        setCurrentView('onboarding');
      }
    }
  }, [isAuthenticated, accountInfo]);
  (0, _react.useEffect)(() => {
    return () => {
      setLoginCompleted(false);
    };
  }, []);
  (0, _react.useEffect)(() => {}, [isAuthenticated, accountInfo]);
  if (loading) {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "fixed inset-0 bg-black bg-opacity-50"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        ref: overlayRef,
        className: "fixed bottom-0 left-0 right-0 w-full bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out flex items-center justify-center",
        style: {
          height: 'calc(var(--vh, 1vh) * 50)'
        },
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
        })
      })]
    });
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "fixed inset-0 bg-black bg-opacity-50",
      onClick: handleClose,
      style: {
        touchAction: 'none'
      }
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      ref: overlayRef,
      className: "fixed bottom-0 left-0 right-0 w-full bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out flex flex-col",
      style: {
        maxHeight: '60vh',
        minHeight: '45vh',
        height: 'auto',
        touchAction: 'none'
      },
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "sticky top-0 bg-white z-10 px-6 pt-3 pb-2",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-12 h-1.5 bg-gray-300 rounded-full mx-auto"
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex-1 overflow-y-auto px-6 pb-8",
        style: {
          touchAction: 'pan-y'
        },
        children: renderContent()
      })]
    })]
  });
}