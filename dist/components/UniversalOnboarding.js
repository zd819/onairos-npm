"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = UniversalOnboarding;
var _react = _interopRequireWildcard(require("react"));
var _framerMotion = require("framer-motion");
var _lucideReact = require("lucide-react");
var _oauthHelper = require("./utils/oauthHelper");
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const socialPlatforms = [{
  name: 'YouTube',
  icon: 'https://onairos.sirv.com/Images/youtube-icon.png',
  connected: false,
  color: '#FF0000'
}, {
  name: 'Reddit',
  icon: 'https://onairos.sirv.com/Images/reddit-icon.png',
  connected: false,
  color: '#FF4500'
}, {
  name: 'Instagram',
  icon: 'https://onairos.sirv.com/Images/instagram-icon.png',
  connected: false,
  color: '#E1306C'
}, {
  name: 'Pinterest',
  icon: 'https://onairos.sirv.com/Images/pinterest-icon.png',
  connected: false,
  color: '#E60023'
}, {
  name: 'TikTok',
  icon: 'https://onairos.sirv.com/Images/tiktok-icon.png',
  connected: false,
  color: '#000000'
}];
const steps = {
  CONNECT: 'connect',
  PASSPHRASE: 'passphrase',
  CONFIRM: 'confirm',
  UNIFYING: 'unifying'
};
function UniversalOnboarding(_ref) {
  let {
    onComplete,
    appIcon
  } = _ref;
  const [platforms, setPlatforms] = (0, _react.useState)(socialPlatforms);
  const [currentStep, setCurrentStep] = (0, _react.useState)(steps.CONNECT);
  const [unifyProgress, setUnifyProgress] = (0, _react.useState)(0);
  const [passphrase, setPassphrase] = (0, _react.useState)('');
  const [passphraseError, setPassphraseError] = (0, _react.useState)('');
  const [isLoading, setIsLoading] = (0, _react.useState)(false);

  // Listen for OAuth callbacks
  (0, _react.useEffect)(() => {
    const handleOAuthCallback = event => {
      if (event.data && event.data.platform && event.data.status === 'success') {
        setPlatforms(platforms.map(p => p.name.toLowerCase() === event.data.platform.toLowerCase() ? {
          ...p,
          connected: true
        } : p));
      }
    };
    window.addEventListener('message', handleOAuthCallback);
    return () => window.removeEventListener('message', handleOAuthCallback);
  }, [platforms]);

  // Handle unification progress
  (0, _react.useEffect)(() => {
    if (currentStep === steps.UNIFYING) {
      const interval = setInterval(() => {
        setUnifyProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            onComplete();
            return 100;
          }
          return prev + 2;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [currentStep, onComplete]);
  const handleConnect = async platformName => {
    try {
      setIsLoading(true);
      // Use OAuth helper to open popup window
      const authWindow = (0, _oauthHelper.createOAuthWindow)(`https://api2.onairos.uk/auth/${platformName.toLowerCase()}`, platformName);

      // The actual connection will be handled by the useEffect that listens for the OAuth callback
      setIsLoading(false);
    } catch (error) {
      console.error(`Failed to connect to ${platformName}:`, error);
      setIsLoading(false);
    }
  };
  const handleContinueToPassphrase = () => {
    if (platforms.some(p => p.connected)) {
      setCurrentStep(steps.PASSPHRASE);
    }
  };
  const validatePassphrase = () => {
    if (!passphrase || passphrase.length < 8) {
      setPassphraseError('Passphrase must be at least 8 characters');
      return false;
    }
    setPassphraseError('');
    return true;
  };
  const handleContinueToConfirm = () => {
    if (validatePassphrase()) {
      setCurrentStep(steps.CONFIRM);
    }
  };
  const handleUnify = async () => {
    setCurrentStep(steps.UNIFYING);
    try {
      const response = await fetch('https://api2.onairos.uk/unify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('onairosToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platforms: platforms.filter(p => p.connected).map(p => p.name.toLowerCase()),
          passphrase: passphrase
        })
      });
      if (!response.ok) {
        throw new Error('Failed to unify data');
      }
    } catch (error) {
      console.error('Failed to unify data:', error);
      // Handle error appropriately
    }
  };
  const renderConnectStep = () => /*#__PURE__*/(0, _jsxRuntime.jsxs)(_framerMotion.motion.div, {
    initial: {
      opacity: 0
    },
    animate: {
      opacity: 1
    },
    exit: {
      opacity: 0
    },
    className: "flex flex-col items-center space-y-6 w-full",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
      className: "text-xl font-semibold text-gray-900",
      children: "Connect Your Accounts"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-md",
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-start",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_lucideReact.Shield, {
          className: "text-blue-500 mr-2 flex-shrink-0 mt-0.5",
          size: 20
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-sm text-blue-700",
          children: "Your data is never shared with anyone. It's only used to train your personal model and is stored securely."
        })]
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "grid grid-cols-2 gap-4 w-full max-w-md",
      children: platforms.map(platform => /*#__PURE__*/(0, _jsxRuntime.jsxs)(_framerMotion.motion.button, {
        onClick: () => handleConnect(platform.name),
        disabled: isLoading || platform.connected,
        whileHover: {
          scale: platform.connected ? 1 : 1.03
        },
        whileTap: {
          scale: platform.connected ? 1 : 0.98
        },
        className: `flex flex-col items-center justify-center p-4 rounded-lg border ${platform.connected ? 'bg-green-50 border-green-500' : 'border-gray-300 hover:border-blue-500 hover:shadow-sm'}`,
        children: [/*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "relative",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            src: platform.icon,
            alt: platform.name,
            className: "w-10 h-10 mb-2"
          }), platform.connected && /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
            className: "absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5",
            children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_lucideReact.Check, {
              size: 14,
              className: "text-white"
            })
          })]
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
          className: `text-sm ${platform.connected ? 'text-green-600' : 'text-gray-700'}`,
          children: platform.connected ? 'Connected' : `Connect`
        })]
      }, platform.name))
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
      onClick: handleContinueToPassphrase,
      disabled: !platforms.some(p => p.connected),
      className: `w-full max-w-md py-3 px-4 rounded-lg font-semibold transition-all ${platforms.some(p => p.connected) ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`,
      children: "Continue"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
      className: "text-xs text-gray-500 max-w-md text-center",
      children: "Connect at least one account to create your personalized AI model"
    })]
  });
  const renderPassphraseStep = () => /*#__PURE__*/(0, _jsxRuntime.jsxs)(_framerMotion.motion.div, {
    initial: {
      opacity: 0
    },
    animate: {
      opacity: 1
    },
    exit: {
      opacity: 0
    },
    className: "flex flex-col items-center space-y-6 w-full",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
      className: "text-xl font-semibold text-gray-900",
      children: "Create Your Secure Passphrase"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-md",
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "flex items-start",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_lucideReact.Lock, {
          className: "text-blue-500 mr-2 flex-shrink-0 mt-0.5",
          size: 20
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
          className: "text-sm text-blue-700",
          children: "Your passphrase is used to secure your model. We don't store it, so please remember it for future access."
        })]
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "w-full max-w-md",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("label", {
        htmlFor: "passphrase",
        className: "block text-sm font-medium text-gray-700 mb-1",
        children: "8+ Character Passphrase"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
        type: "password",
        id: "passphrase",
        value: passphrase,
        onChange: e => setPassphrase(e.target.value),
        placeholder: "Enter your secure passphrase",
        className: `w-full p-3 border ${passphraseError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`
      }), passphraseError && /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
        className: "mt-1 text-sm text-red-600 flex items-center",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_lucideReact.AlertCircle, {
          size: 14,
          className: "mr-1"
        }), " ", passphraseError]
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex space-x-3 w-full max-w-md",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        onClick: () => setCurrentStep(steps.CONNECT),
        className: "flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50",
        children: "Back"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        onClick: handleContinueToConfirm,
        className: "flex-1 py-3 px-4 bg-blue-500 rounded-lg font-semibold text-white hover:bg-blue-600",
        children: "Continue"
      })]
    })]
  });
  const renderConfirmStep = () => /*#__PURE__*/(0, _jsxRuntime.jsxs)(_framerMotion.motion.div, {
    initial: {
      opacity: 0
    },
    animate: {
      opacity: 1
    },
    exit: {
      opacity: 0
    },
    className: "flex flex-col items-center space-y-6 w-full",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
      className: "text-xl font-semibold text-gray-900",
      children: "Confirm Data Transfer"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "flex justify-center items-center w-full max-w-md py-8",
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
        className: "relative flex items-center",
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "p-3 bg-gray-100 rounded-full",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            src: appIcon || "https://onairos.sirv.com/Images/onairos-icon.png",
            alt: "App",
            className: "w-16 h-16 rounded-full"
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)(_framerMotion.motion.div, {
          animate: {
            x: [0, 10, 0]
          },
          transition: {
            repeat: Infinity,
            duration: 1.5
          },
          className: "mx-4",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_lucideReact.Send, {
            size: 24,
            className: "text-blue-500"
          })
        }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
          className: "p-3 bg-blue-100 rounded-full",
          children: /*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            src: "https://onairos.sirv.com/Images/onairos-icon.png",
            alt: "Onairos",
            className: "w-16 h-16 rounded-full"
          })
        })]
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-md",
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
        className: "text-sm text-blue-700",
        children: "You're about to securely send your data to Onairos to train your personal AI model. Your data is end-to-end encrypted with your passphrase and never shared with anyone."
      })
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "w-full max-w-md",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h3", {
        className: "font-medium text-gray-700 mb-2",
        children: "Connected platforms:"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: "flex flex-wrap gap-2",
        children: platforms.filter(p => p.connected).map(platform => /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
          className: "flex items-center bg-green-50 border border-green-200 rounded-full px-3 py-1",
          children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("img", {
            src: platform.icon,
            alt: platform.name,
            className: "w-4 h-4 mr-1"
          }), /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
            className: "text-sm text-green-700",
            children: platform.name
          })]
        }, platform.name))
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("div", {
      className: "flex space-x-3 w-full max-w-md",
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        onClick: () => setCurrentStep(steps.PASSPHRASE),
        className: "flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50",
        children: "Back"
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("button", {
        onClick: handleUnify,
        className: "flex-1 py-3 px-4 bg-blue-500 rounded-lg font-semibold text-white hover:bg-blue-600",
        children: "Confirm & Create Model"
      })]
    }), /*#__PURE__*/(0, _jsxRuntime.jsxs)("p", {
      className: "text-xs text-gray-500 max-w-md text-center",
      children: ["By proceeding, you agree to Onairos' ", /*#__PURE__*/(0, _jsxRuntime.jsxs)("a", {
        href: "https://onairos.uk/privacy",
        target: "_blank",
        rel: "noopener noreferrer",
        className: "text-blue-500 underline flex items-center inline-flex",
        children: ["Privacy Policy ", /*#__PURE__*/(0, _jsxRuntime.jsx)(_lucideReact.ExternalLink, {
          size: 12,
          className: "ml-0.5"
        })]
      })]
    })]
  });
  const renderUnifyingStep = () => /*#__PURE__*/(0, _jsxRuntime.jsxs)(_framerMotion.motion.div, {
    initial: {
      opacity: 0
    },
    animate: {
      opacity: 1
    },
    className: "flex flex-col items-center justify-center space-y-6 p-6",
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("h2", {
      className: "text-xl font-semibold text-gray-900",
      children: "Creating Your Personal AI Model"
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
      className: "text-gray-600 text-center",
      children: "Please wait while we securely process your information"
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
    }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
      className: "bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-md",
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)("p", {
        className: "text-sm text-blue-700",
        children: "Your data is being encrypted with your passphrase and securely processed. This may take a few minutes."
      })
    })]
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
    className: "flex flex-col items-center space-y-6 p-6 w-full",
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(_framerMotion.AnimatePresence, {
      mode: "wait",
      children: [currentStep === steps.CONNECT && renderConnectStep(), currentStep === steps.PASSPHRASE && renderPassphraseStep(), currentStep === steps.CONFIRM && renderConfirmStep(), currentStep === steps.UNIFYING && renderUnifyingStep()]
    })
  });
}