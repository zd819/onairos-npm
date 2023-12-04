import React, { useEffect, useState } from 'react';
import onairosLogo from "./OnairosBlack.png";

function Onairos( {requestData, proofMode=false,webpageName}) {
  const [token,setToken] = useState();
  const OnairosAnime = async () => {
    try {
      console.log("Clicked Onairos Connect")
      await ConnectOnairos();
    } catch (error) {
      // Handle any errors here
      console.error("Error connecting to Onairos", error);
    }
  };

  const requestToken = async () =>{
    const domain = window.location.hostname;
    const response = await fetch('https://api2.onairos.uk/dev/request-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
    });

    if (!response.ok) {
        throw new Error('Token request failed: ' + response.statusText);
    }

    const data = await response.json();
    setToken(data.token);
    // this.token = data.token; // Store the token
  }

  const ConnectOnairos = async () => {
    // Title here has to match a model in the Users : accountInfo.AccountInfo.models
    // Prepare the data to be sent
    // Send the data to the content script
    
    await requestToken();

    window.postMessage({
      source: 'webpage',
      type: 'GET_API_URL',
      webpageName: webpageName,
      access_token:token,
      requestData: requestData,
      proofMode:proofMode
    });
  };

  return (
    <div>
      <button
        className="OnairosConnect w-20 h-20 flex flex-col items-center justify-center text-white font-bold py-2 px-4 rounded cursor-pointer"
        onClick={OnairosAnime}
      >
        <img src={onairosLogo} alt="Onairos Logo" className="w-16 h-16 object-contain mb-2" /> {/* Adjust size as needed */}
        <span className="whitespace-nowrap">Connect to Onairos</span> {/* Prevent text from wrapping */}
      </button>
    </div>
  );
}

export default Onairos;

