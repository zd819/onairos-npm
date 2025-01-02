"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = UniversalOnboarding;
var _react = _interopRequireWildcard(require("react"));
var _framerMotion = require("framer-motion");
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const socialPlatforms = [{
  name: 'YouTube',
  icon: 'https://onairos.sirv.com/Images/youtube-icon.png',
  connected: false
}, {
  name: 'Reddit',
  icon: 'https://onairos.sirv.com/Images/reddit-icon.png',
  connected: false
}, {
  name: 'Instagram',
  icon: 'https://onairos.sirv.com/Images/instagram-icon.png',
  connected: false
}, {
  name: 'Pinterest',
  icon: 'https://onairos.sirv.com/Images/pinterest-icon.png',
  connected: false
}];
function UniversalOnboarding(_ref) {
  let {
    onComplete
  } = _ref;
  const [platforms, setPlatforms] = (0, _react.useState)(socialPlatforms);
  const [isUnifying, setIsUnifying] = (0, _react.useState)(false);
  const [unifyProgress, setUnifyProgress] = (0, _react.useState)(0);
  (0, _react.useEffect)(() => {
    if (isUnifying) {
      const interval = setInterval(() => {
        setUnifyProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUnifying(false);
            onComplete();
            return 100;
          }
          return prev + 2;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isUnifying, onComplete]);
  const handleConnect = async platformName => {
    // Implement OAuth flow for each platform
    try {
      const response = await fetch(`https://api2.onairos.uk/connect/${platformName.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('onairosToken')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setPlatforms(platforms.map(p => p.name === platformName ? {
          ...p,
          connected: true
        } : p));
      }
    } catch (error) {
      console.error(`Failed to connect to ${platformName}:`, error);
    }
  };
  const handleUnify = async () => {
    if (platforms.some(p => p.connected)) {
      setIsUnifying(true);
      try {
        const response = await fetch('https://api2.onairos.uk/unify', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('onairosToken')}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          onComplete();
        }
      } catch (error) {
        console.error('Failed to unify data:', error);
      }
    }
  };
  if (isUnifying) {
    return /*#__PURE__*/(0, _jsxRuntime.jsxs)(_framerMotion.motion.div, {
      initial: {
        opacity: 0
      },
      animate: {
        opacity: 1
      },
      className: "flex flex-col items-center justify-center space-y-6 p-6",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
        className: "text-xl font-semibold text-gray-900",
        children: "Unifying Your Data"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
        className: "text-gray-600 text-center",
        children: "Please wait while we process your information"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "w-full max-w-md",
        children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "relative pt-1",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
            className: "flex mb-2 items-center justify-between",
            children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              children: /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
                className: "text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200",
                children: "Progress"
              })
            }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
              className: "text-right",
              children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("span", {
                className: "text-xs font-semibold inline-block text-blue-600",
                children: [unifyProgress, "%"]
              })
            })]
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_framerMotion.motion.div, {
            className: "overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_framerMotion.motion.div, {
              initial: {
                width: 0
              },
              animate: {
                width: `${unifyProgress}%`
              },
              transition: {
                duration: 0.5
              },
              className: "shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
            })
          })]
        })
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_framerMotion.motion.div, {
        animate: {
          rotate: 360
        },
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        },
        className: "w-12 h-12",
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)("svg", {
          className: "w-full h-full text-blue-500",
          viewBox: "0 0 24 24",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("path", {
            fill: "currentColor",
            d: "M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"
          })
        })
      })]
    });
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
    className: "flex flex-col items-center space-y-6 p-6",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
      className: "text-xl font-semibold text-gray-900",
      children: "Connect Your Accounts"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
      className: "text-gray-600 text-center",
      children: "Connect at least one account to create your personality model"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "grid grid-cols-2 gap-4 w-full max-w-md",
      children: platforms.map(platform => /*#__PURE__*/(0, _jsxRuntime.jsxs)("button", {
        onClick: () => handleConnect(platform.name),
        className: `flex items-center justify-center p-4 rounded-lg border ${platform.connected ? 'bg-green-50 border-green-500' : 'border-gray-300 hover:border-blue-500'}`,
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
          src: platform.icon,
          alt: platform.name,
          className: "w-8 h-8 mr-2"
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: platform.connected ? 'text-green-600' : 'text-gray-700',
          children: platform.connected ? 'Connected' : `Connect ${platform.name}`
        })]
      }, platform.name))
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      onClick: handleUnify,
      disabled: !platforms.some(p => p.connected),
      className: `w-full max-w-md py-3 px-4 rounded-lg font-semibold ${platforms.some(p => p.connected) ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`,
      children: "Unify and Create Model"
    })]
  });
}