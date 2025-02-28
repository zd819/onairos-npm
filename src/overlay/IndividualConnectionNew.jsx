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
    <div className={`relative p-4 sm:p-6 rounded-sm overflow-hidden mb-8 ${
      isDisabled ? 'bg-gray-100' : 'bg-indigo-200'
    }`}>
      <div className="relative">
        <div className="flex-center">
          <Box
            active={props.active}
            onSelectionChange={(isSelected) => {
              setSelected(isSelected);
              props.onSelectionChange(isSelected);
              if (isSelected) {
                props.changeGranted(1);
              } else {
                props.changeGranted(-1);
              }
            }}
            disabled={isDisabled}
            setSelected={setSelected}
            number={props.number + 1}
            type="Test"
            title={props.title}
          />
        </div>

        <div className="flex items-center mt-2">
          {isDisabled && (
            <span className="text-sm text-red-500 font-medium">
              {`No ${props.title} data available to share`}
            </span>
          )}
        </div>

        {props.descriptions && props.title !== "Avatar" && (
          <p className={`text-sm font-medium ${
            isDisabled ? 'text-gray-500' : 'text-gray-900'
          } dark:text-gray-300`}>
            Intent: {props.descriptions}
          </p>
        )}

        {props.rewards && (
          <p className={`text-sm font-medium ${
            isDisabled ? 'text-gray-500' : 'text-gray-900'
          } dark:text-gray-300`}>
            Rewards: {props.rewards}
          </p>
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