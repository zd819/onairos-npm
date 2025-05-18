import React from 'react';
import { OnairosButton } from './onairosButton.jsx';

/**
 * Main export for React Native environments
 * This component is optimized for React Native usage
 */
const Onairos = (props) => {
  return (
    <OnairosButton {...props} />
  );
};

export { OnairosButton };
export default Onairos;
