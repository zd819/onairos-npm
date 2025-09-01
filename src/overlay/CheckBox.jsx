import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function Box({ 
  active,
  onSelectionChange,
  changeGranted,
  setSelected,
  number,
  type,
  title
}) {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = (newState) => {
    setIsChecked(newState);
    console.log("This data request is active:", active);
    console.log("With new Checked state now being:", newState);
    
    // Update the counter
    if (newState) {
      changeGranted(1);
    } else {
      changeGranted(-1);
    }
    
    // Call parent callback if provided
    if (onSelectionChange) {
      onSelectionChange(newState);
    }
  };

  return (
    <div className="group">
      <div className="relative">
        {/* Custom styled checkbox with clear visual feedback */}
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={isChecked}
              disabled={!active}
              onChange={(e) => handleCheckboxChange(e.target.checked)}
              className="sr-only" // Hide default checkbox
            />
            
            {/* Custom checkbox appearance */}
            <div className={`
              w-6 h-6 border-2 rounded-md flex items-center justify-center transition-all duration-200
              ${!active 
                ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50' 
                : isChecked 
                  ? 'border-green-500 bg-green-500 shadow-md transform scale-105' 
                  : 'border-gray-400 bg-white hover:border-green-400 hover:bg-green-50'
              }
            `}>
              {/* Checkmark icon */}
              {isChecked && (
                <svg 
                  className="w-4 h-4 text-white animate-pulse" 
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
          <span className={`ml-3 text-sm font-medium transition-colors duration-200 ${
            !active 
              ? 'text-gray-400' 
              : isChecked 
                ? 'text-green-600 font-semibold' 
                : 'text-gray-700'
          }`}>
            {!active 
              ? 'Not available' 
              : isChecked 
                ? '✓ Selected' 
                : 'Click to select'
            }
          </span>
        </label>
        
        {/* Selection indicator badge */}
        {isChecked && active && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

Box.propTypes = {
  active: PropTypes.bool.isRequired,
  onSelectionChange: PropTypes.func,
  changeGranted: PropTypes.func.isRequired,
  setSelected: PropTypes.func,
  number: PropTypes.number,
  type: PropTypes.string,
  title: PropTypes.string.isRequired
};

export default Box; 