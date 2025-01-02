import { useState, useRef, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import AuthButtons from '../components/AuthButtons';
import IndividualConnection from './IndividualConnection';
const API_URL = process.env.REACT_APP_API_URL || 'https://api2.onairos.uk';

export default function Overlay({ 
  setOthentConnected,
  dataRequester, 
  NoAccount, 
  NoModel, 
  activeModels, 
  setActiveModels,
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
  // setIsAuthenticated,
  onClose,
  onLoginSuccess,
  setOthent,
  setHashedOthentSub,
  setEncryptedPin
}) {
  const [loginError, setLoginError] = useState(null);
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef(null);

  // Set dynamic viewport height
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH(); // Set initial value
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  const close = async () =>{
    changeGranted(0);
    onClose();
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target)) {
        // Call a prop to close the overlay
        close?.(); // Make sure to add close to props
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [close]);

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

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
      await onLoginSuccess(decoded.email);
    } catch (error) {
      console.error('Google login failed:', error);
      setLoginError('Google login failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    setLoginError('Google login failed. Please try again.');
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

      const response = await fetch('https://api2.onairos.uk/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginAttempt),
      });

      const data = await response.json();
      console.log("Login resonse data :" , data)

      if (data.authentication === 'Accepted') {
        localStorage.setItem('onairosToken', data.token);
        localStorage.setItem('username', formData.username);
        // setLocalIsAuthenticated(true); // Update local state
        // setIsAuthenticated(true);
        console.log("Username of user: ", formData.username)
        await onLoginSuccess(formData.username);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('Invalid username or password');
    }
  };

  const handleLoginSuccess = async (username) => {
    setLoading(true);
    try {
      // Call the parent's onLoginSuccess handler
      await onLoginSuccess(username);
    } catch (error) {
      console.error('Login process failed:', error);
      setLoginError('Failed to complete login process');
    } finally {
      setLoading(false);
    }
  };

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

  if (!isAuthenticated) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={close} />
        <div 
          ref={overlayRef} 
          className="fixed bottom-0 left-0 right-0 w-full bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out"
          style={{ 
            maxHeight: '80vh',
            minHeight: '50vh',
            height: 'auto'
          }}
        >
          <div className="sticky top-0 bg-white z-10">
            <div className="w-full flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>
          </div>

          <div className="overflow-y-auto px-6 pb-8">
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
            </div>
          </div>
        </div>
      </>
    );
  }

  // Data requests section
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={close} />
      <div 
        ref={overlayRef} 
        className="fixed bottom-0 left-0 right-0 w-full bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out"
        style={{ 
          maxHeight: '80vh',
          minHeight: '50vh',
          height: 'auto'
        }}
      >
        <div className="sticky top-0 bg-white z-10">
          <div className="w-full flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        <div className="overflow-y-auto px-6 pb-8">
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
              disabled={!allowSubmit || granted ==0 }
              className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-full ${(!allowSubmit|| granted === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={sendDataRequest}
            >
              Confirm ({granted})
            </button>
          </div>

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
              {Object.keys(requestData).sort((a, b) => {
                const aIsActive = activeModels.includes(requestData[a].type);
                const bIsActive = activeModels.includes(requestData[b].type);
                
                if(requestData[a].type === "Avatar") return 1;
                if(requestData[b].type === "Avatar") return -1;
                if(requestData[b].type === "Traits") return 1;
                if(requestData[a].type === "Traits") return -1;
                if (aIsActive && !bIsActive) return -1;
                if (bIsActive && !aIsActive) return 1;
                return 0;
              }).map((key, index) => {
                const product = requestData[key];
                console.log("Active Models: ", activeModels)
                const active = product.type === 'Personality' ? activeModels.includes(product.type) 
                           : product.type === 'Avatar' ? avatar
                           : product.type === 'Traits' ? traits : false;
                return (
                  <div key={key}>
                    <IndividualConnection
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}