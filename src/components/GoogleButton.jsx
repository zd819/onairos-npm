import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

export default function GoogleButton({ onLoginSuccess }) {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      
      const response = await fetch('https://api2.onairos.uk/login/google-signin', {
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

      const data = await response.json();
      localStorage.setItem('onairosToken', data.token);
      await onLoginSuccess(decoded.email);
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => console.error('Google Login Failed')}
        shape="circle"
        theme="outline"
      />
      <span className="text-xs mt-2 text-gray-600">Google</span>
    </div>
  );
} 