import React, { useState, useRef, useEffect } from 'react';
// import Box from './CheckBox';
// import traitsIcon;
// import interestIcon;
// import Sentiment from '../icons/Sentiment.png';
// import Avatar from '../icons/Avatar.png';
// import Avatar2 from '../icons/Avatar2.png';
// import Trait from '../icons/Trait.png';
import PropTypes from 'prop-types';

export default function IndividualConnection(props) {
  const [isChecked, setIsChecked] = useState(false);
  useEffect(() => {
    if (isChecked) {
      props.changeGranted(1);
    } else {
      props.changeGranted(-1);
    }
  }, [isChecked]);
  const handleCheckboxChange = (newState) => {
    setIsChecked(newState);
    console.log("Following has been clicked :", props.title)
    console.log("With new Checked state now being: ", newState)
    console.log("Current number of selection: ", (props.number + 1))
    // onSelectionChange(type);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
        <div className="group">
          <div>
            <input
              disabled={!props.active}
              type="checkbox"
              checked={isChecked}
              onChange={(e) => {
                // setIsChecked(e.target.checked);

                handleCheckboxChange(e.target.checked);
              }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          {/* {props.title === "Traits" ? (
            // Image to represent Traits
            <img src={Trait} alt="Traits Icon" className="w-6 h-6 mr-2" />
          ) :
          props.title === "Avatar" ? (
            // Image to represent Traits
            <img src={Avatar2} alt="Avatar Icon" className="w-8 h-8 mr-2" />
          ) :
           (
            // Image to represent Interest
            <img src={Sentiment} alt="Interest Icon" className="w-6 h-6 mr-2" />
          )} */}
          {/* <p className="text-sm font-medium text-gray-900 dark:text-gray-300">
            Access your Onairos {Insight}
          </p> */}
        </div>
        {props.descriptions && (props.title !== "Avatar") && (
          <p className="text-sm font-medium text-gray-900 dark:text-gray-300">Intent: {props.descriptions}</p>
        )}
        {props.rewards && (
          <p className="text-sm font-medium text-gray-900 dark:text-gray-300">Rewards: {props.rewards}</p>
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
