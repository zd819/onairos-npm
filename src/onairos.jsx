import React, { useState } from 'react';
import onairosLogo from "./OnairosBlack.png";


function Onairos( {requestData, webpageName, proofMode=false}) {
  // const [token,setToken] = useState('');
  const OnairosAnime = async () => {
    try {
      console.log("Clicked Onairos Connect")
      await ConnectOnairos();
    } catch (error) {
      // Handle any errors here
      console.error("Error connecting to Onairos", error);
    }
  };

    const domain = window.location.href;

  const ConnectOnairos = async () => {

    // Testing User Secure Details
    const HashedActive = "HashedActive";
    const EncryptUserDetails = "EncryptUserDetails";

    // Prepare the data to be sent
    window.postMessage({
      source: 'webpage',
      type: 'GET_API_URL',
      webpageName: webpageName,
      domain:domain,
      requestData: requestData,
      proofMode:proofMode,
      HashedActive:HashedActive,
      EncryptUserDetails:EncryptUserDetails
    });
  };

  return (
    <div>
      <button
        className="OnairosConnect w-20 h-20 flex flex-col items-center justify-center text-white font-bold py-2 px-4 rounded cursor-pointer"
        onClick={OnairosAnime}
      >
        <img src={"https://onairos.sirv.com/Images/OnairosBlack.png"} 
        alt="Onairos Logo" className="w-16 h-16 object-contain mb-2" /> {/* Adjust size as needed */}
        <span className="whitespace-nowrap">Connect to Onairos</span> {/* Prevent text from wrapping */}
      </button>
    </div>
  );
}

export default Onairos;

