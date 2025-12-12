import React, { useEffect } from 'react';
import { COLORS } from '../theme/colors.js';

export default function WelcomeScreen({ onContinue, onClose }) {
  // Load Sirv script for responsive images
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://scripts.sirv.com/sirvjs/v3/sirv.js';
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      const existingScript = document.querySelector('script[src="https://scripts.sirv.com/sirvjs/v3/sirv.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col" style={{ height: '100%' }}>
      {/* Content - Flexible center area */}
      <div className="px-6 pt-16 text-center flex-1 flex flex-col">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 flex items-center justify-center">
            <img 
              className="Sirv w-full h-full object-contain" 
              data-src="https://anushkasirv.sirv.com/OnairosBlack.png" 
              alt="Onairos Logo"
            />
          </div>
        </div>

        {/* Welcome Text */}
        <p className="text-gray-500 text-sm mb-2">Welcome to</p>

        {/* Main Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-6 text-balance">Onairos</h1>

        {/* Description */}
        <p className="text-gray-600 text-base leading-relaxed mb-12 text-pretty px-2">
          OnairOS personalizes your digital experience on every app so you can just enjoy being you!
        </p>
      </div>

      {/* Get Started Button - Fixed at bottom */}
      <div className="px-6 pb-8 flex-shrink-0">
        <button
          className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-4 text-base font-medium flex items-center justify-center gap-2 transition-colors"
          onClick={onContinue}
        >
          Get Started
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
