// import Sentiment from '../icons/Sentiment.png';
// import Avatar from '../icons/Avatar.png';
// import Avatar2 from '../icons/Avatar2.png';
// import Trait from '../icons/Trait.png';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
function Box({ active, onSelectionChange, changeGranted, setSelected, number }) {
  const [isChecked, setIsChecked] = useState(false);

  const handleChange = (e) => {
    const newCheckedState = e.target.checked;
    setIsChecked(newCheckedState);
    setSelected(newCheckedState);
    onSelectionChange(newCheckedState);
    changeGranted(prev => newCheckedState ? prev + 1 : prev - 1);
  };

  return (
    <div className="relative inline-block">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="hidden"
        id={`box-${number}`}
      />
      <label
        htmlFor={`box-${number}`}
        className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer transition-all duration-200 ${
          isChecked 
            ? 'border-blue-500 bg-blue-500' 
            : 'border-gray-300 bg-white'
        }`}
      >
        {isChecked && (
          <svg 
            className="w-3 h-3 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="3" 
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </label>
    </div>
  );
}

export default Box;
  