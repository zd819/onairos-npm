import React, { useState, useRef, useEffect } from 'react';
import Box from './box';
// import traitsIcon;
// import interestIcon;
// import Sentiment from '../icons/Sentiment.png';
// import Avatar from '../icons/Avatar.png';
// import Avatar2 from '../icons/Avatar2.png';
// import Trait from '../icons/Trait.png';
import PropTypes from 'prop-types';

function IndividualConnection(props) {
  const [selected, setSelected] = useState(false);

  // const Insight = (props.title === "Avatar")? 'Avatar' : (props.title === "Traits")? 'Personality Traits':(props.size === 'Small Insight') ? 'Basic' : (props.size === 'Medium') ? 'Standard Insight' : 'Detailed Insight';
  const Insight = (props.title === "Avatar")? 'Avatar' : (props.title === "Traits")? 'Personality Traits': 'Persona'
  
  return (
    <div className="relative bg-indigo-200 p-4 sm:p-6 rounded-sm overflow-hidden mb-8">

      <div className="relative">
        <div className="flex-center">
          <Box
            active={props.active}
            onSelectionChange={props.onSelectionChange}
            changeGranted={props.changeGranted}
            setSelected={setSelected} 
            number={props.number + 1} 
            type={"Test"} 
            title={props.title}
          /> 
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

export default IndividualConnection;
