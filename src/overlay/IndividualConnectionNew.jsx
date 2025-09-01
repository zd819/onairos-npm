import React, { useState } from 'react';
import Box from './CheckBox';
import PropTypes from 'prop-types';

function IndividualConnection(props) {
  const [selected, setSelected] = useState(false);
  const isDisabled = !props.active;

  const Insight = props.title === "Avatar" ? 'Avatar' : 
                 props.title === "Traits" ? 'Personality Traits' : 
                 'Persona';

  return (
    <div className={`relative p-4 sm:p-6 rounded-lg overflow-hidden mb-4 transition-all duration-300 border-2 ${
      isDisabled 
        ? 'bg-gray-50 border-gray-200 opacity-60' 
        : selected 
          ? 'bg-green-50 border-green-400 shadow-lg transform scale-[1.02]' 
          : 'bg-white border-gray-300 hover:border-blue-300 hover:shadow-md'
    }`}>
      
      {/* Selection Status Indicator */}
      {selected && !isDisabled && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      <div className="relative">
        {/* Header with title and status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Data type icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
              isDisabled 
                ? 'bg-gray-200 text-gray-400' 
                : selected 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-500 text-white'
            }`}>
              {props.title === "Avatar" ? "👤" : 
               props.title === "Traits" ? "🧠" : 
               props.title === "Personality" ? "🎭" : "📊"}
            </div>
            
            <div>
              <h3 className={`text-lg font-semibold ${
                isDisabled ? 'text-gray-400' : selected ? 'text-green-700' : 'text-gray-800'
              }`}>
                {Insight}
              </h3>
              
              {/* Status badge */}
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isDisabled 
                  ? 'bg-red-100 text-red-600' 
                  : selected 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
              }`}>
                {isDisabled ? '❌ Not Available' : selected ? '✅ Selected' : '⏳ Available'}
              </div>
            </div>
          </div>
        </div>

        {/* Checkbox with enhanced styling */}
        <div className="flex items-center justify-center mb-4">
          <Box
            active={props.active}
            onSelectionChange={(isSelected) => {
              setSelected(isSelected);
              if (props.onSelectionChange) {
                props.onSelectionChange(isSelected);
              }
              if (props.changeGranted) {
                if (isSelected) {
                  props.changeGranted(1);
                } else {
                  props.changeGranted(-1);
                }
              }
            }}
            disabled={isDisabled}
            setSelected={setSelected}
            number={props.number + 1}
            type="Test"
            title={props.title}
            changeGranted={props.changeGranted}
          />
        </div>

        {/* Status message for disabled items */}
        <div className="flex items-center justify-center mb-3">
          {isDisabled && (
            <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                {`No ${props.title} data available to share`}
              </span>
            </div>
          )}
          
          {selected && !isDisabled && (
            <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                This data will be shared
              </span>
            </div>
          )}
        </div>

        {/* Description and rewards */}
        {props.descriptions && props.title !== "Avatar" && (
          <div className="mb-2">
            <p className={`text-sm font-medium ${
              isDisabled ? 'text-gray-400' : 'text-gray-700'
            }`}>
              <span className="text-blue-600 font-semibold">Intent:</span> {props.descriptions}
            </p>
          </div>
        )}

        {props.rewards && (
          <div className="mb-2">
            <p className={`text-sm font-medium ${
              isDisabled ? 'text-gray-400' : 'text-gray-700'
            }`}>
              <span className="text-green-600 font-semibold">Rewards:</span> {props.rewards}
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
  changeGranted: PropTypes.func.isRequired,
  onSelectionChange: PropTypes.func.isRequired
};

export default IndividualConnection; 