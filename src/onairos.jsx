import React, { useState, useEffect } from 'react';
import * as othentKMS from '@othent/kms';
import sha256 from 'crypto-js/sha256';
import { rsaEncrypt } from './RSA';
import getPin from './getPin';

// import Buffer
export function Onairos( {requestData, webpageName, proofMode=false}) {
  
  const OnairosAnime = async () => {
    try {
      await ConnectOnairos();
    } catch (error) {
      // Handle any errors here
      console.error("Error connecting to Onairos", error);
    }
  };

  const OnairosPublicKey = `
    -----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4wkWvRPaJiY8CwQ5BoJI
    amcGAYV91Bk8NrvWq4PXM+J/RJugfgTNCYKQ/c6g4xa1YES/tJEzFS7nf0Kdoqxm
    5aav0ru5vS4fc4vCOLTI9W1T7nj02NY91rogsQm2/KMxUQ8DaLeTZKi+0Wjsa9YO
    6XGGd1wh4azgQkj04MWW5J1EBCcBavKoY+C85oA9jkkklQ8nGWgbugmZs7eXHNQb
    qH8/ZHcB9Kx1CZ6XjQuVd6YE/A+swV+DksbkXANcYjr6SY/2TbB8GfpcOMM3bkyN
    Q8e0A51q5a8abfuAkDZXe67MwKMWu/626abwPZhJrKr5HhRZZDwPtnXlktYHhOK6
    lQIDAQAB
    -----END PUBLIC KEY-----
      `;

  const domain = window.location.href;

  const ConnectOnairos = async () => {
    let hashedOthentSub, userPin;
    
    try{
      // Testing User Secure Details
      const userDetails = await othentKMS.connect();
      hashedOthentSub = sha256(userDetails.sub).toString();

      const encryptedPin = await getPin(hashedOthentSub);
      const encryptedPinBuffer = Buffer.from(encryptedPin, 'base64');
      userPin = await othentKMS.decrypt(encryptedPinBuffer);

    }catch(e){
      console.error("Error Connecting to Othent : ", e);
    }
    
    rsaEncrypt(OnairosPublicKey, userPin)
    .then(encryptedData => {
        // Prepare the data to be sent
        window.postMessage({
          source: 'webpage',
          type: 'GET_API_URL',
          webpageName: webpageName,
          domain:domain,
          requestData: requestData,
          proofMode:proofMode,
          hashedOthentSub:hashedOthentSub,
          encryptedUserPin:encryptedData
        });
    })
    .catch(error => {
        console.error("Encryption failed:", error);
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

// // export default Onairos;

// module.exports = Onairos;