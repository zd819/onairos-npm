import React from 'react';
import onairosLogo from "./OnairosBlack.png";

function Onairos( {requestData, onairosID, access_token, proofMode=false,webpageName}) {
  const OnairosAnime = async () => {
    try {
      console.log("Clicked Onairos Connect")
      await ConnectOnairos();
    } catch (error) {
      // Handle any errors here
      console.error("Error connecting to Onairos", error);
    }
  };

  const ConnectOnairos = async () => {
    // Title here has to match a model in the Users : accountInfo.AccountInfo.models
    // Prepare the data to be sent
    // Send the data to the content script
    window.postMessage({
      source: 'webpage',
      type: 'GET_API_URL',
      webpageName: webpageName,
      onairosID:onairosID,
      access_token:access_token,
      account:"ConnectedAccountRef.current", //No Longer needed, REMOVE
      requestData: requestData,
      proofMode:proofMode
    });
  };

  return (
    <div>
      <button
        className="OnairosConnect flex flex-col items-center justify-center text-white font-bold py-2 px-4 rounded cursor-pointer"
        onClick={OnairosAnime}
      >
        <img src={onairosLogo} alt="Onairos Logo" className="w-5 h-5 max-w-10 object-scale-down mb-2" />
        <span>Connect to Onairos</span>
      </button>
    </div>
  );
}

export default Onairos;
