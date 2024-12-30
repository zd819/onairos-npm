"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Overlay;
var _react = require("react");
var _google = require("@react-oauth/google");
var _jwtDecode = require("jwt-decode");
var _jsxRuntime = require("react/jsx-runtime");
const API_URL = process.env.REACT_APP_API_URL || 'https://api2.onairos.uk';
function Overlay(_ref) {
  let {
    dataRequester,
    NoAccount,
    NoModel,
    activeModels,
    requestData,
    handleConnectionSelection,
    changeGranted,
    granted,
    allowSubmit,
    rejectDataRequest,
    sendDataRequest,
    avatar,
    traits,
    isAuthenticated,
    loading,
    onLoginSuccess
  } = _ref;
  const [loginError, setLoginError] = (0, _react.useState)(null);
  const [formData, setFormData] = (0, _react.useState)({
    email: '',
    password: ''
  });
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
      await onLoginSuccess(decoded.email);
    } catch (error) {
      console.error('Google login failed:', error);
      setLoginError('Google login failed. Please try again.');
    }
  };
  const handleGoogleError = () => {
    setLoginError('Google login failed. Please try again.');
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
      const response = await fetch('https://api2.onairos.uk/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginAttempt)
      });
      console.log("Login resonse :", response);
      const data = await response.json();
      if (data.authentication === 'Accepted') {
        localStorage.setItem('onairosToken', data.token);
        localStorage.setItem('username', formData.username);
        await onLoginSuccess(formData.username);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('Invalid email or password');
    }
  };
  if (loading) {
    return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-sm rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out min-h-[200px] flex items-center justify-center",
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
      })
    });
  }
  if (!isAuthenticated) {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "fixed inset-0 bg-black/30 backdrop-blur-sm"
      }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-sm rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-full flex justify-center pt-3 pb-2",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "w-12 h-1.5 bg-gray-300 rounded-full"
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "px-6 pb-8",
          children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex flex-col items-center justify-start max-w-sm mx-auto space-y-6",
            children: [loginError && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4",
              children: loginError
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_google.GoogleLogin, {
              onSuccess: handleGoogleSuccess,
              onError: handleGoogleError,
              useOneTap: true,
              theme: "outline",
              size: "large",
              text: "continue_with",
              shape: "rectangular",
              width: "320"
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
                type: "email",
                name: "email",
                value: formData.email,
                onChange: handleInputChange,
                placeholder: "Email",
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
            })]
          })
        })]
      })]
    });
  }

  // Data requests section
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "fixed inset-0 bg-black/30 backdrop-blur-sm"
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "fixed bottom-0 left-0 right-0 w-full h-[50vh] bg-white/95 backdrop-blur-sm rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "w-full flex justify-center pt-3 pb-2",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "w-12 h-1.5 bg-gray-300 rounded-full"
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "w-full h-[calc(50vh-24px)] overflow-y-auto",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "px-6 py-2",
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
              disabled: !allowSubmit,
              className: `bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-full ${!allowSubmit ? 'opacity-50 cursor-not-allowed' : ''}`,
              onClick: sendDataRequest,
              children: ["Confirm (", granted, ")"]
            })]
          }), activeModels.length === 0 ? /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
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
              return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
                children: /*#__PURE__*/(0, _jsxRuntime.jsx)(IndividualConnection, {
                  active: active,
                  title: product.type,
                  id: product,
                  number: index,
                  descriptions: product.descriptions,
                  rewards: product.reward,
                  size: key,
                  changeGranted: changeGranted,
                  onSelectionChange: isSelected => handleConnectionSelection(dataRequester, key, index, product.type, product.reward, isSelected)
                })
              }, key);
            })
          })]
        })
      })]
    })]
  });
}