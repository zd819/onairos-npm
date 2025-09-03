import React from 'react';

/**
 * LoadingPage Component
 * Displays a loading spinner with optional theme
 */
const LoadingPage = ({ theme = 'black' }) => {
  const spinnerColor = theme === 'black' ? 'border-black' : 'border-white';
  const textColor = theme === 'black' ? 'text-black' : 'text-white';
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${spinnerColor} mb-4`}></div>
      <p className={`text-sm font-medium ${textColor}`}>Loading...</p>
    </div>
  );
};

export default LoadingPage;
