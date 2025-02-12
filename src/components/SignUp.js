import React, { useState } from 'react';
 import AuthButtons from './AuthButtons.jsx';

export default function SignUp({ onSignUpSuccess, setOthent, setHashedOthentSub, setEncryptedPin }) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      const response = await fetch('https://api2.onairos.uk/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('onairosToken', data.token);
        localStorage.setItem('username', formData.username);
        onSignUpSuccess(formData.username);
      } else {
        setError(data.message || 'Sign up failed');
      }
    } catch (error) {
      setError('Sign up failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-start max-w-sm mx-auto space-y-6 pt-4">
      {error && (
        <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <AuthButtons 
        onLoginSuccess={onSignUpSuccess}
        setOthent={setOthent}
        setHashedOthentSub={setHashedOthentSub}
        setEncryptedPin={setEncryptedPin}
      />

      <div className="w-full flex items-center justify-center space-x-4">
        <hr className="flex-grow border-gray-300" />
        <span className="text-gray-500">or</span>
        <hr className="flex-grow border-gray-300" />
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Email"
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
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
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="Confirm Password"
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
} 