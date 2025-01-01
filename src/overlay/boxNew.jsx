import React from 'react';
import PropTypes from 'prop-types';

function Box({ active, onSelectionChange, disabled, title }) {
  const handleClick = () => {
    if (!disabled) {
      onSelectionChange(!active);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        flex items-center justify-between p-4 rounded-lg cursor-pointer
        ${disabled ? 
          'bg-gray-100 cursor-not-allowed' : 
          active ? 
            'bg-blue-500 text-white' : 
            'bg-white hover:bg-gray-50'
        }
        transition-colors duration-200
      `}
    >
      <div className="flex items-center">
        <span className={`text-lg font-medium ${disabled ? 'text-gray-400' : active ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </span>
      </div>
      
      {!disabled && (
        <div className={`
          w-6 h-6 rounded-full border-2 flex items-center justify-center
          ${active ? 
            'border-white bg-blue-600' : 
            'border-gray-300 bg-white'
          }
        `}>
          {active && <span className="text-white">✓</span>}
        </div>
      )}
      
      {disabled && (
        <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">×</span>
        </div>
      )}
    </div>
  );
}

Box.propTypes = {
  active: PropTypes.bool.isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  title: PropTypes.string.isRequired
};

export default Box; 