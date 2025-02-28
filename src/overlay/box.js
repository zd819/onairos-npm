import React, { useState, useEffect } from 'react';

export default function Box({ 
  active, 
  onSelectionChange, 
  changeGranted, 
  number,
  title,
  type 
}) {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = (e) => {
    console.log("Active: ", active, "Checked box : ", isChecked)
    // Use the event's checked value directly
    const newCheckedState = e.target.checked;
    // setIsChecked(newCheckedState);
    setIsChecked(newCheckedState);

    console.log("With new Checked state now being: ", newCheckedState)
    
    // // Update the counter
    // if (newCheckedState) {
    //   changeGranted(1);
    // } else {
    //   changeGranted(-1);
    // }
    
    // onSelectionChange(type);
  };

  // Reset checkbox when overlay closes or becomes inactive
  useEffect(() => {
    if (!active) {
      setIsChecked(false);
    }
  }, [active]);

  return (
    <div className="group">
      <div
        className={`flex items-center mb-4 transition-all duration-200 ${
          !active ? 'opacity-50' : 'hover:opacity-90'
        }`}
      >
        <input
          id={`checkbox-${number}`}
          type="checkbox"
          value=""
          checked={isChecked} // Controlled component
          onChange={handleCheckboxChange}
          disabled={!active}
          className={`
            w-5 h-5 
            rounded
            transition-all duration-200
            focus:ring-2 focus:ring-offset-2
            ${active 
              ? 'text-blue-600 border-gray-300 bg-gray-100 focus:ring-blue-500 cursor-pointer hover:bg-blue-50' 
              : 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
            }
            ${isChecked && active ? 'bg-blue-500 border-blue-500' : ''}
          `}
        />
        <label
          htmlFor={`checkbox-${number}`}
          className={`ml-3 flex items-center select-none transition-colors duration-200 ${
            active ? 'text-gray-900 cursor-pointer' : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <span className="text-sm font-medium">
            {title || `Request ${number}`}
          </span>
        </label>
      </div>
      
      {!active && (
        <div className="ml-9 text-sm text-red-600 animate-fade-in">
          Please create your Personality model to access this Grant Request
        </div>
      )}
    </div>
  );
}
