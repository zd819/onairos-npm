import React from 'react';

/**
 * Box Component
 * Displays a checkbox item for data access requests
 */
const Box = (props) => {
  const handleChange = (e) => {
    const checked = e.target.checked;
    console.log(`Checkbox ${props.title} is now: ${checked ? 'checked' : 'unchecked'}`);
    if (checked) {
      props.setSelected(true);
      props.changeGranted(1);
    } else {
      props.setSelected(false);
      props.changeGranted(-1);
    }
    
    props.onSelectionChange(checked);
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        id={`request-${props.number}`}
        disabled={!props.active}
        onChange={handleChange}
        className={`
          appearance-none w-5 h-5 border rounded
          ${!props.active ? 'border-gray-300 bg-gray-100 cursor-not-allowed' : 'border-blue-500 cursor-pointer'}
          checked:bg-blue-600 checked:border-blue-600
          focus:outline-none focus:ring-2 focus:ring-blue-500/30
          transition-colors
        `}
      />
      <svg 
        className="absolute left-0.5 top-0.5 w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
      </svg>
      
      {!props.active && (
        <span className="ml-2 text-xs text-red-500 font-medium">
          Not available
        </span>
      )}
    </div>
  );
};

export default Box;
