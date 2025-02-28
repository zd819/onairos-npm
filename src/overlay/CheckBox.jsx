import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function Box({ 
  active,
  onSelectionChange,
  changeGranted,
  setSelected,
  number,
  type,
  title}) {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = (newState) => {
    setIsChecked(newState);
    console.log("This data request is active :", active)
    console.log("With new Checked state now being: ", newState)
    // Update the counter
    if (newState) {
      changeGranted(1);
    } else {
      changeGranted(-1);
    }
    // onSelectionChange(type);
  };

return (
  <div className="group">
    <div
      
    >
      <input
        // disabled={!active}
        type="checkbox"
        checked={isChecked}
        onChange={(e) => {
          // setIsChecked(e.target.checked);

          handleCheckboxChange(e.target.checked);
        }}
      />
    </div>
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