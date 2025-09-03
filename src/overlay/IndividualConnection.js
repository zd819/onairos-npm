import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function IndividualConnection({
  active,
  title,
  id,
  number,
  descriptions,
  rewards,
  size,
  isChecked,
  onCheckboxChange,
}) {
  return (
    <div className={`relative p-4 sm:p-6 rounded-lg overflow-hidden mb-4 transition-all duration-300 border-2 ${
      !active 
        ? 'bg-gray-50 border-gray-200 opacity-60' 
        : isChecked 
          ? 'bg-green-50 border-green-400 shadow-lg transform scale-[1.02] ring-2 ring-green-200' 
          : 'bg-white border-gray-300 hover:border-blue-300 hover:shadow-md'
    }`}>
      
      {/* Selection Status Indicator */}
      {isChecked && active && (
        <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      <div className="relative">
        {/* Header with title and status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Data type icon */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
              !active 
                ? 'bg-gray-200 text-gray-400' 
                : isChecked 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : 'bg-blue-500 text-white'
            }`}>
              {title === "Avatar" ? "👤" : 
               title === "Traits" ? "🧠" : 
               title === "Personality" ? "🎭" : "📊"}
            </div>
            
            <div>
              <h3 className={`text-xl font-bold ${
                !active ? 'text-gray-400' : isChecked ? 'text-green-700' : 'text-gray-800'
              }`}>
                {title === "Avatar" ? 'Avatar' : 
                 title === "Traits" ? 'Personality Traits' : 
                 title === "Personality" ? 'Personality Model' :
                 title}
              </h3>
              
              {/* Status badge */}
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                !active 
                  ? 'bg-red-100 text-red-700' 
                  : isChecked 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
              }`}>
                {!active ? '❌ Not Available' : isChecked ? '✅ SELECTED' : '⏳ Available'}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Checkbox */}
        <div className="flex items-center justify-center mb-4">
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={isChecked}
                disabled={!active}
                onChange={(e) => onCheckboxChange(e.target.checked)}
                className="sr-only" // Hide default checkbox
              />
              
              {/* Custom checkbox appearance */}
              <div className={`
                w-8 h-8 border-3 rounded-lg flex items-center justify-center transition-all duration-200
                ${!active 
                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50' 
                  : isChecked 
                    ? 'border-green-500 bg-green-500 shadow-xl transform scale-110' 
                    : 'border-gray-400 bg-white hover:border-green-400 hover:bg-green-50 hover:scale-105'
                }
              `}>
                {/* Checkmark icon */}
                {isChecked && (
                  <svg 
                    className="w-6 h-6 text-white animate-bounce" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                )}
              </div>
            </div>
            
            {/* Selection status text */}
            <span className={`ml-4 text-lg font-bold transition-colors duration-200 ${
              !active 
                ? 'text-gray-400' 
                : isChecked 
                  ? 'text-green-600' 
                  : 'text-gray-700'
            }`}>
              {!active 
                ? 'Not available' 
                : isChecked 
                  ? '✓ SELECTED FOR SHARING' 
                  : 'Click to select'
              }
            </span>
          </label>
        </div>

        {/* Status message for disabled items */}
        <div className="flex items-center justify-center mb-4">
          {!active && (
            <div className="flex items-center space-x-2 text-sm text-red-700 bg-red-100 px-4 py-3 rounded-lg border-2 border-red-300">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-bold">
                {`No ${title} data available to share`}
              </span>
            </div>
          )}
          
          {isChecked && active && (
            <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-100 px-4 py-3 rounded-lg border-2 border-green-300 animate-pulse">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-bold">
                THIS DATA WILL BE SHARED
              </span>
            </div>
          )}
        </div>

        {/* Description and rewards with enhanced styling */}
        {descriptions && title !== "Avatar" && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className={`text-sm font-semibold ${
              !active ? 'text-gray-400' : 'text-blue-800'
            }`}>
              <span className="text-blue-600">🎯 Intent:</span> {descriptions}
            </p>
          </div>
        )}

        {rewards && (
          <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className={`text-sm font-semibold ${
              !active ? 'text-gray-400' : 'text-yellow-800'
            }`}>
              <span className="text-yellow-600">🎁 Rewards:</span> {rewards}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

IndividualConnection.propTypes = {
  active: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  id: PropTypes.any.isRequired,
  number: PropTypes.number.isRequired,
  descriptions: PropTypes.string,
  rewards: PropTypes.string,
  size: PropTypes.string.isRequired,
  isChecked: PropTypes.bool.isRequired,
  onCheckboxChange: PropTypes.func.isRequired,
};
