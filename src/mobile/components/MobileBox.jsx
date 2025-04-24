import React, { useState, useEffect } from 'react';

/**
 * MobileBox Component
 * Mobile-optimized checkbox component for data request selections
 */
export default function MobileBox({ 
  active, 
  onSelectionChange, 
  changeGranted, 
  number,
  title,
  type 
}) {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = (e) => {
    // Get the checked state
    const newCheckedState = e.target.checked;
    setIsChecked(newCheckedState);
    
    // Update the counter
    if (newCheckedState) {
      changeGranted(1);
    } else {
      changeGranted(-1);
    }
    
    // Report the selection change to parent
    onSelectionChange(newCheckedState);
  };

  // Reset checkbox when overlay closes or becomes inactive
  useEffect(() => {
    if (!active) {
      setIsChecked(false);
    }
  }, [active]);

  return (
    <div className="mobile-box-container">
      <div
        className={`mobile-checkbox-wrapper ${!active ? 'inactive' : 'active'}`}
      >
        <input
          id={`mobile-checkbox-${number}`}
          type="checkbox"
          value=""
          checked={isChecked}
          onChange={handleCheckboxChange}
          disabled={!active}
          className={`mobile-checkbox ${isChecked && active ? 'checked' : ''}`}
        />
        <label
          htmlFor={`mobile-checkbox-${number}`}
          className={`mobile-checkbox-label ${active ? 'active' : 'inactive'}`}
        >
          <span className="mobile-checkbox-title">
            {title || `Request ${number}`}
          </span>
        </label>
      </div>
      
      {!active && (
        <div className="mobile-inactive-message">
          Please create your Personality model to access this Grant Request
        </div>
      )}
    </div>
  );
}
