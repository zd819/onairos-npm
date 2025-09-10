import React from 'react';
import { COLORS } from '../theme/colors.js';

export default function WelcomeScreen({ onContinue, onClose, webpageName, appIcon, testMode }) {
  // Get app name from webpageName prop, fallback to generic text
  const appName = webpageName || 'every app';
  
  // Test mode fallback icon
  const getAppIcon = () => {
    if (appIcon) {
      return (
        <img 
          src={appIcon} 
          alt={`${appName} logo`}
          className="w-12 h-12 rounded-xl object-cover"
        />
      );
    }
    
    if (testMode) {
      // Test mode placeholder - colorful gradient placeholder
      return (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-xl">
            {appName.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    }
    
    // Fallback generic app icon
    return (
      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col" style={{ height: '100%' }}>
      {/* Welcome Text - Always at top when app provided */}
      {(appIcon || webpageName) && (
        <div className="px-6 text-center pt-6 pb-2 flex-shrink-0">
          <p className="text-gray-500 text-sm mb-2">Welcome to</p>
          <h1 className="text-4xl font-bold text-gray-900 text-balance">Onairos</h1>
        </div>
      )}

      {/* Content - Flexible center area */}
      <div className="px-6 text-center flex-1 flex flex-col justify-center">
        {/* Visual Flow: Onairos → Arrow → App (when app info provided) */}
        {(appIcon || webpageName) ? (
          <div className="flex flex-col items-center">
            {/* App Logos with Data Flow - Centered and Symmetrical */}
            <div className="flex items-start justify-center gap-6 mb-8">
              {/* Onairos Logo - Fixed width for symmetry */}
              <div className="flex flex-col items-center w-20">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-2">
                  <div className="w-6 h-6 relative">
                    {/* VR Headset Icon - Smaller */}
                    <svg viewBox="0 0 32 32" className="w-full h-full">
                      <path
                        d="M4 12c0-2.2 1.8-4 4-4h16c2.2 0 4 1.8 4 4v8c0 2.2-1.8 4-4 4h-4l-2-3h-4l-2 3H8c-2.2 0-4-1.8-4-4v-8z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle cx="10" cy="16" r="2" fill="currentColor" />
                      <circle cx="22" cy="16" r="2" fill="currentColor" />
                      <path d="M12 24c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600 text-center leading-tight">Onairos</span>
              </div>

              {/* Data Flow Arrow - Aligned to logos */}
              <div className="flex flex-col items-center mt-3">
                <svg className="w-8 h-6 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="text-xs text-gray-400">data</span>
              </div>

              {/* App Logo - Fixed width for symmetry with text wrapping */}
              <div className="flex flex-col items-center w-20">
                {getAppIcon()}
                <span className="text-xs font-medium text-gray-600 mt-2 text-center leading-tight break-words hyphens-auto">
                  {appName}
                </span>
              </div>
            </div>

            {/* Description - Updated with bold/underlined app name */}
            <p className="text-gray-600 text-base leading-relaxed text-pretty px-2">
              Onairos makes your experience on <span className="font-bold underline">{appName}</span> and everywhere else 1000x better
            </p>
          </div>
        ) : (
          /* Original layout when no app info */
          <div className="flex flex-col items-center">
            <div className="mb-8 flex justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 relative">
                  {/* VR Headset Icon */}
                  <svg viewBox="0 0 32 32" className="w-full h-full">
                    <path
                      d="M4 12c0-2.2 1.8-4 4-4h16c2.2 0 4 1.8 4 4v8c0 2.2-1.8 4-4 4h-4l-2-3h-4l-2 3H8c-2.2 0-4-1.8-4-4v-8z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="10" cy="16" r="2" fill="currentColor" />
                    <circle cx="22" cy="16" r="2" fill="currentColor" />
                    <path d="M12 24c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </div>
              </div>
            </div>
            
            <p className="text-gray-500 text-sm mb-2">Welcome to</p>
            <h1 className="text-4xl font-bold text-gray-900 mb-6 text-balance">Onairos</h1>
            
            <p className="text-gray-600 text-base leading-relaxed text-pretty px-2">
              Onairos makes your experience on {appName} and everywhere else 1000x better
            </p>
          </div>
        )}
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
