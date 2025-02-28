import React from 'react';
import { OnairosButton } from './onairosButton.jsx';

// Configuration object for the Telegram SDK

export function Onairos(props) {
  return (
    <>
    {/* <DeepLink/> */}
      <OnairosButton {...props} />
    </>
  );
}

export default Onairos;
