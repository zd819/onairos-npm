

import React from 'react';
// import {connect, decrypt} from '@othent/kms';
// import sha256 from 'crypto-js/sha256';
import { rsaEncrypt } from './RSA';
import getPin from './getPin';
// import { Buffer } from 'buffer';

// Dynamic import for crypto-js's sha256
const loadSha256 = async () => {
  const module = await import(/* webpackChunkName: "sha256" */ 'crypto-js/sha256');
  return module.default;
};

// // Dynamic import for @othent/kms
const loadOthentKms = async () => {
  try{
    console.log("Entering Dynamic Othent Load")
    const module = await import(/* webpackChunkName: "othent-kms" */ '@othent/kms');
    console.log("DYNAMICALLY LOADED OTHENT")
    return module;
  }catch(e){
    console.error("Error loading Othent DYnamically : ", e)
  }
};

// import Buffer
export function Onairos( {requestData, webpageName, proofMode=false}) {

  const validateRequestData = () => {
    const validKeys = ['Small', 'Medium', 'Large'];
    const requiredProperties = ['type', 'descriptions', 'reward'];
    if( typeof webpageName !== 'string'){
      throw new Error(`Property webpageName must be a String`);

    }
    for (const key of validKeys) {
      if (!(key in requestData)) {
        throw new Error(`Missing key '${key}' in requestData.`);
      }
      for (const prop of requiredProperties) {
        if (!(prop in requestData[key])) {
          throw new Error(`Missing property '${prop}' in requestData.${key}.`);
        }
        if (prop !== 'reward' && typeof requestData[key][prop] !== 'string') {
          throw new Error(`Property '${prop}' in requestData.${key} must be a string.`);
        }
        if (prop !== 'reward' && requestData[key][prop].trim() === '') {
          throw new Error(`Property '${prop}' in requestData.${key} cannot be empty.`);
        }
      }
    }
    // Add any other validation rules as necessary
  };
  
  const OnairosAnime = async () => {
    if (checkOnairosExtension()) {
        // The extension is installed
        // Proceed with the domain validation request or any other logic
        if(validateDomain().status){
          // Valid Domain
          // Proceed with the domain validation request or any other logic
          try {
            validateRequestData();
            await ConnectOnairos();
          } catch (error) {
            // Handle any errors here
            console.error("Error connecting to Onairos", error);
          }
        }else{
          console.error("Please make sure this is an Onairos Partnered app");
        }
    } else {
        // The extension is not installed
        // Open the Chrome Web Store page to download the extension
        window.open('https://chromewebstore.google.com/detail/onairos/apkfageplidiblifhnadehmplfccapkf', '_blank');
    }
  
    const checkOnairosExtension = () => {
      return typeof window.onairosExtension !== 'undefined';
    };

    const validateDomain = async () => {
        // Your logic to validate the domain goes here
        // For example, you could make an API request to your backend
        return fetch('https://api2.onairos.uk/valid/validate-domain', {
            method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        }).then(r => r.json().then(data => ({status: r.status, body: data})))
        .catch(error => console.error(error));
    };

  
    
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
    try{
      // Get User Othent Secure Details
      console.log("Main initiate othent")
      const { connect} = await loadOthentKms();
      console.log("Main loaded othent")
      const userDetails = await connect();

      const sha256 = await loadSha256();
      const hashedOthentSub = sha256(userDetails.sub).toString();

      const encryptedPin = await getPin(hashedOthentSub);

      function convertToBuffer(string) {
        try {
          // Decode base64 string
          const encodedData = window.atob(string);
          const uint8Array = new Uint8Array(encodedData.length);
          for (let i = 0; i < encodedData.length; i++) {
            uint8Array[i] = encodedData.charCodeAt(i);
          }
          return uint8Array.buffer; // This is an ArrayBuffer
        } catch (e) {
          console.error("Error converting to Buffer :", e);
        }
      }
      
      const bufferPIN = convertToBuffer(encryptedPin.result);


      const {decrypt }= await loadOthentKms();
      const userPin = await decrypt(bufferPIN);

      // RSA Encrypt the PIN to transmit to Terminal and backend
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
            HashedOthentSub:hashedOthentSub,
            EncryptedUserPin:encryptedData
          });
      })
      .catch(error => {
          console.error("Encryption failed:", error);
      });

    }catch(e){
      console.error({fix:"Please ensure you have stored your model"});
      console.error("Error Sending Data to Terminal: ", e);
    }

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