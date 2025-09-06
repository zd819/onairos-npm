import React from 'react';
import { COLORS } from '../theme/colors.js';

export default function WelcomeScreen({ onContinue, onClose }) {
  return (
    <div className="w-full flex flex-col" style={{ height: '100%' }}>
      {/* Header with close button */}
      <div className="relative px-6 pt-6 pb-4 flex-shrink-0">
        <button
          onClick={onClose}
          className="absolute left-6 top-6 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content - Flexible center area */}
      <div className="px-6 text-center flex-1 flex flex-col justify-center">
        {/* Avatar */}
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
