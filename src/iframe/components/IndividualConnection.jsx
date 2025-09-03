import React, { useState } from 'react';
import Box from './Box';

/**
 * IndividualConnection Component
 * Displays a card for each data connection request
 */
function IndividualConnection(props) {
  const [selected, setSelected] = useState(false);

  const handleSelectionChange = (isSelected) => {
    setSelected(isSelected);
    props.onSelectionChange(isSelected);
  };

  // Get icon based on data type
  const getDataTypeIcon = () => {
    switch(props.title) {
      case "Profile":
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case "User Memories":
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-5">
        <div className="flex items-start space-x-4">
          {getDataTypeIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-800">{props.title}</h3>
              <Box
                active={props.active}
                onSelectionChange={handleSelectionChange}
                changeGranted={props.changeGranted}
                setSelected={setSelected}
                number={props.number + 1}
                type={"Test"}
                title={props.title}
              />
            </div>
            
            {props.descriptions && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">{props.descriptions}</p>
              </div>
            )}
          </div>
        </div>
        
        {props.rewards && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-gray-500">Benefit: <span className="text-gray-700">{props.rewards}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IndividualConnection;
