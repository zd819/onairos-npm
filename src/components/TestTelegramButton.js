import React, { useState, useEffect } from 'react';

export default function TestTelegramButton() {
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const handleClick = () => {
    try {
      addLog('Opening external browser...');
      const data = { key: 'value' }; // Example data
      const queryString = new URLSearchParams(data).toString();
      const testUrl = `https://internship.onairos.uk/auth?${queryString}`;
      // const testUrl = `https://onairos.uk/auth?${queryString}`;

      // Use standard JavaScript to open the link in a new tab
      window.open(testUrl, '_blank');

    } catch (error) {
      console.error('Failed to open link:', error);
      addLog(`Failed to open link: ${error.message}`);
      setError(`Failed to open link: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <button
        onClick={handleClick}
        className="flex flex-col items-center justify-center px-4 py-2 border border-gray-300 rounded-full shadow-sm bg-white hover:bg-gray-50"
      >
        <div className="relative">
          <img 
            src="google-icon.png" 
            alt="Google"
            className="w-10 h-10 rounded-full"
          />
          <svg 
            className="absolute bottom-0 right-0 w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 3a1 1 0 011 1v6h6a1 1 0 110 2h-6v6a1 1 0 11-2 0v-6H3a1 1 0 110-2h6V4a1 1 0 011-1z" />
          </svg>
        </div>
        <span className="text-gray-700 mt-2">Google</span>
      </button>
    </div>
  );
} 