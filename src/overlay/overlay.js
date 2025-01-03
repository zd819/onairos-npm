import { useState, useRef, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import AuthButtons from '../components/AuthButtons';
import IndividualConnection from './IndividualConnection';
import SecuritySetup from '../components/SecuritySetup';
import UniversalOnboarding from '../components/UniversalOnboarding';
import SignUp from '../components/SignUp';


export default function Overlay({ 
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
}) {
  const [loginError, setLoginError] = useState(null);
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef(null);
  const [currentView, setCurrentView] = useState(() => {
    if (isAuthenticated) {
      if (accountInfo && accountInfo.models?.length > 0) {
        return 'datarequests';
      }
      return 'onboarding';
    }
    return 'login';
  });
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loginCompleted, setLoginCompleted] = useState(false);
  const API_URL = 'https://api2.onairos.uk';

  // Set dynamic viewport height
  useEffect(() => {
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
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoginError(null);
      const decoded = jwtDecode(credentialResponse.credential);
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
          email: decoded.email
        })
      });

      if (!response.ok) {
        throw new Error('Google authentication failed');
      }

      const { token } = await response.json();
      localStorage.setItem('onairosToken', token);
      await handleLoginSuccess(decoded.email, true);
    } catch (error) {
      console.error('Google login failed:', error);
      setLoginError('Google login failed. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOnairosLogin = async (e) => {
    e.preventDefault();
    try {
      setLoginError(null);
      const loginAttempt = {
        details: {
          username: formData.username,
          password: formData.password,
        },
      };

      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginAttempt),
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

  const handleLoginSuccess = async (identifier, isEmail = false) => {
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

  const handleSecurityComplete = (securityDetails) => {
    // Handle security setup completion
    if (securityDetails.method === 'othent') {
      setOthent(true);
    } else if (securityDetails.method === 'pin') {
      setEncryptedPin(securityDetails.value);
    }
    setCurrentView('datarequests');
  };

  const DataRequestsSection = ({ 
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
  }) => {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-6">
            Data Requests from {dataRequester}
          </h1>
          
          <div className="flex items-center justify-between mb-6">
            <button 
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-8 rounded-full" 
              onClick={rejectDataRequest}
            >
              Reject All
            </button>
            <button 
              disabled={!allowSubmit || granted === 0}
              className={`${
                allowSubmit && granted > 0
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-300 cursor-not-allowed'
              } text-white font-bold py-2 px-8 rounded-full`}
              onClick={sendDataRequest}
            >
              Confirm ({granted})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {activeModels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <img src="https://onairos.sirv.com/Images/OnairosWhite.png" alt="Onairos Logo" className="w-24 h-24 mb-4" />
              <p className="text-center text-gray-800 font-medium">
                Please connect <a href="https://onairos.uk/connections" className="text-blue-500 hover:underline">Onairos</a> Personality 
                to send {dataRequester} your data
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.keys(requestData)
                .sort((a, b) => {
                  const aIsActive = activeModels.includes(requestData[a].type);
                  const bIsActive = activeModels.includes(requestData[b].type);
                  if (requestData[a].type === "Avatar") return 1;
                  if (requestData[b].type === "Avatar") return -1;
                  if (requestData[b].type === "Traits") return 1;
                  if (requestData[a].type === "Traits") return -1;
                  if (aIsActive && !bIsActive) return -1;
                  if (bIsActive && !aIsActive) return 1;
                  return 0;
                })
                .map((key, index) => {
                  const product = requestData[key];
                  const active = product.type === 'Personality' ? activeModels.includes(product.type) 
                             : product.type === 'Avatar' ? avatar
                             : product.type === 'Traits' ? traits : false;
                  return (
                    <IndividualConnection
                      key={key}
                      active={active}
                      title={product.type}
                      id={product}
                      number={index}
                      descriptions={product.descriptions}
                      rewards={product.reward}
                      size={key}
                      changeGranted={changeGranted}
                      onSelectionChange={(isSelected) => handleConnectionSelection(dataRequester, key, index, product.type, product.reward, isSelected)}
                    />
                  );
                })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'signup':
        return (
          <SignUp 
            onSignUpSuccess={handleLoginSuccess}
            setOthent={setOthent}
            setHashedOthentSub={setHashedOthentSub}
            setEncryptedPin={setEncryptedPin}
          />
        );
      case 'onboarding':
        return <UniversalOnboarding onComplete={handleOnboardingComplete} />;
      case 'security':
        return <SecuritySetup onComplete={handleSecurityComplete} />;
      case 'datarequests':
        return (
          <DataRequestsSection 
            dataRequester={dataRequester}
            granted={granted}
            allowSubmit={allowSubmit}
            rejectDataRequest={rejectDataRequest}
            sendDataRequest={sendDataRequest}
            activeModels={activeModels}
            requestData={requestData}
            handleConnectionSelection={handleConnectionSelection}
            changeGranted={changeGranted}
            avatar={avatar}
            traits={traits}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-start max-w-sm mx-auto space-y-6 pt-4">
            {loginError && (
              <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {loginError}
              </div>
            )}

            <AuthButtons 
              onLoginSuccess={handleLoginSuccess}
              setOthent={setOthent}
              setHashedOthentSub={setHashedOthentSub}
              setEncryptedPin={setEncryptedPin}
            />

            <div className="w-full flex items-center justify-center space-x-4">
              <hr className="flex-grow border-gray-300" />
              <span className="text-gray-500">or</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            <form onSubmit={handleOnairosLogin} className="w-full space-y-4">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Username"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Sign In
              </button>
            </form>

            <button
              onClick={() => setCurrentView('signup')}
              className="w-full text-center text-blue-500 hover:text-blue-600"
            >
              Don't have an account? Sign up
            </button>
          </div>
        );
    }
  };

  useEffect(() => {
    if (isAuthenticated && accountInfo) {
      if (accountInfo.models?.length > 0) {
        setCurrentView('datarequests');
      } else {
        setCurrentView('onboarding');
      }
    }
  }, [isAuthenticated, accountInfo]);

  useEffect(() => {
    return () => {
      setLoginCompleted(false);
    };
  }, []);

  useEffect(() => {
  }, [isAuthenticated, accountInfo])

  if (loading) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50" />
        <div 
          ref={overlayRef} 
          className="fixed bottom-0 left-0 right-0 w-full bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out flex items-center justify-center"
          style={{ height: 'calc(var(--vh, 1vh) * 50)' }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={handleClose}
        style={{ touchAction: 'none' }}
      />
      <div 
        ref={overlayRef} 
        className="fixed bottom-0 left-0 right-0 w-full bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out flex flex-col"
        style={{ 
          maxHeight: '60vh',
          minHeight: '45vh',
          height: 'auto',
          touchAction: 'none'
        }}
      >
        <div className="sticky top-0 bg-white z-10 px-6 pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto"></div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8" style={{ touchAction: 'pan-y' }}>
          {renderContent()}
        </div>
      </div>
    </>
  );
}