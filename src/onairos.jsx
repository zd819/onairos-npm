import React from 'react';
import onairosLogo from "./OnairosBlack.png";

function Onairos() {
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
    console.log("Sending Data to Extension")

    // Title here has to match a model in the Users : accountInfo.AccountInfo.models
    // Prepare the data to be sent
    const dataToSend = {
      interestModel: {
        title:'Interest',
        books:'',
        descriptions:'',
        reward:"10% Discount"
      },
      personalityModel:{
        title:'Personality',
        books:'',
        descriptions:'',
        reward:"2 USDC"
      },
      intelectModel:{
        title:'Intellect',
        books:'',
        descriptions:'',
        reward:"2 USDC"
      },
    };

    const access_token="access_token";
    // Send the data to the content script
    window.postMessage({ source: 'bookstore', type: 'GET_API_URL' }, '*');
    window.postMessage({
      source: 'webpage',
      type: 'GET_API_URL',
      webpage: 'proxy book store',
      access_token:access_token,
      account:"ConnectedAccountRef.current", //No Longer needed, REMOVE
      requestData: dataToSend,
    });
    // chrome.runtime.sendMessage({ source: 'bookstore', type: 'GET_API_URL'});
  };

  return (
    <div>
      <button
        className="OnairosConnect flex flex-col items-center justify-center text-white font-bold py-2 px-4 rounded cursor-pointer"
        onClick={OnairosAnime}
      >
        <img src={onairosLogo} alt="Onairos Logo" className="w-10 h-10 mb-2" />
        <span>Connect to Onairos</span>
      </button>
    </div>
  );
}

export default Onairos;
