import React, {useEffect, useState} from 'react';
// import {connect, decrypt} from '@othent/kms';
import { Othent } from "@othent/kms";
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
// const loadOthentKms = async () => {
//   try{
//     console.log("Entering Dynamic Othent Load")
//     const module = await import(/* webpackChunkName: "othent-kms" */ '@othent/kms');
//     console.log("DYNAMICALLY LOADED OTHENT")
//     return module;
//   }catch(e){
//     console.error("Error loading Othent DYnamically : ", e)
//   }
// };



// import Buffer
export function Onairos({
  requestData, 
  webpageName, 
  inferenceData= null, 
  onComplete = null, 
  autoFetch = true,// Added
  proofMode=false, textLayout = 'below', 
  textColor = 'white',
  login = false,
  buttonType = 'pill',
  loginReturn = null,
  loginType = 'signIn',  // New prop: signIn, signUp, signOut
  visualType = 'full',  // New prop: full, icon, textOnly
}) {
  const [userData, setUserData] = useState(null);

    // useEffect(()=>{
    //   console.log("USeeffect working")
    // },[])

    const findLargestDataObject = (arrayOfObjects) => {
      // Update the hierarchy
      const hierarchy = {
        'Small': 16,
        'Medium': 32,
        'Large': 64
      };
    
      let largestObject = null;
      let largestValue = 0;
    
      arrayOfObjects.forEach(obj => {
        const currentValue = hierarchy[obj.data];
        if (currentValue > largestValue) {
          largestValue = currentValue;
          largestObject = obj;
        }
      });
    
      return largestValue;
    };


    useEffect(() => {
      // Only proceed if autoFetch is true and onComplete is a function
      if (autoFetch && inferenceData && typeof onComplete === 'function') {
        const handleAPIResponse = async (event) => {
          if (event.data && event.data.source === 'content-script' && event.data.type === 'API_URL_RESPONSE' && event.data.unique === "Onairos-Response") {
            const { APIurl, approved, accessToken } = event.data;

            const trimSize = findLargestDataObject(approved);      
            // Trim the data array based on the allowed number of items
            const trimmedData = inferenceData.slice(0, trimSize);
            // Fetch the new anime data from the API URL
            const jsonData = 
            {
              Input: trimmedData // Your request payload
            };


            try {
              const response = await fetch(APIurl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(jsonData)
              });
              const data = await response.json();
              onComplete(data);
            } catch (error) {
              console.error(error);
              onComplete(null, error);
            }
          }
        };
    
        window.addEventListener('message', handleAPIResponse);
        return () => {
          window.removeEventListener('message', handleAPIResponse);
        };
      }
    }, []);
    
    
    

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
  const checkOnairosExtension = () => {
    if (typeof window.onairos !== 'undefined') {
      console.log('Onairos info:', window.onairos.getInfo());
    } else {
      console.log('Onairos is not installed.');
    }
    // Or listen for the onairosReady event
    window.addEventListener('onairosReady', function() {
      console.log('Onairos was just detected!');
    });
    return typeof window.onairos !== 'undefined';
  };

  const validateDomain = async () => {
      // Your logic to validate the domain goes here
      // For example, you could make an API request to your backend
      return fetch('https://api2.onairos.uk/valid/validate-domain', {
        // return fetch('http://localhost:8080/valid/validate-domain', {
          method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      },
      }).then(r => r.json().then(data => ({status: r.status, body: data})))
      .catch(error => console.error(error));
  };
  const OnairosChecks = async () => {
    if (checkOnairosExtension()) {
        // The extension is installed
        // Proceed with the domain validation request or any other logic
        if((await validateDomain()).body.status){

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
      const othent = new Othent();
      // Get User Othent Secure Details
      // const { connect} = await loadOthentKms();
      const userDetails = await othent.connect();

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
      
      // const {decrypt }= await loadOthentKms();
      const userPin = await othent.decrypt(bufferPIN);
      console.log("Retrieved PIN Working")
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

  const handleLogin = async () => {
    try {
      const othent = new Othent();
      const userDetails = await othent.connect();
      const sha256 = await loadSha256();
      const hashedOthentSub = sha256(userDetails.sub).toString();
      const encryptedPin = await getPin(hashedOthentSub);

      // ... existing PIN decryption logic ...

      const loginData = {
        username: userDetails.username,
        email: userDetails.email,
        // Add any other relevant user data
      };

      setUserData(loginData);

      if (loginReturn) {
        loginReturn(loginData);
      }

      // Prepare the data to be sent
      window.postMessage({
        source: 'webpage',
        type: 'GET_API_URL',
        webpageName: webpageName,
        domain: domain,
        requestData: requestData,
        proofMode: proofMode,
        HashedOthentSub: hashedOthentSub,
        EncryptedUserPin: encryptedData,
        login: true,
        loginData: loginData
      });
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  // Styling and button class based on visual type and login mode
  const buttonClass = 
    `OnairosConnect flex items-center justify-center font-bold rounded cursor-pointer ${
    buttonType === 'pill' ? 'px-4 py-2' : 'w-12 h-12'
    } ${login ? 'bg-white border border-gray-300' : 'bg-transparent'}`
  ;

  const buttonStyle = {
    flexDirection: textLayout === 'below' ? 'column' : 'row',
    backgroundColor: login ? '#ffffff' : 'transparent',
    color: login ? 'black' : textColor,
    border: login ? '1px solid #ddd' : '1px solid transparent',
  };

  // Icon and text style based on the visualType
  const logoStyle = {
    width: '20px',
    height: '20px',
    marginRight: visualType === 'full' ? '12px' : '0',  // Space between icon and text only in full mode
  };

  const getText = () => {
    switch (loginType) {
      case 'signUp':
        return 'Sign Up with Onairos';
      case 'signOut':
        return 'Sign Out of Onairos';
      default:
        return 'Sign In with Onairos';
    }
  };

  return (
    <div className="OnairosConnect flex items-center justify-center">
      <button
        className={buttonClass}
        onClick={login ? handleLogin : OnairosChecks}
        style={buttonStyle}
      >
        {/* Render based on visualType prop */}
        {(visualType === 'full' || visualType === 'icon') && (
          <img
            src={login ? "https://onairos.sirv.com/Images/OnairosWhite.png" : "https://onairos.sirv.com/Images/OnairosBlack.png"}
            alt="Onairos Logo"
            style={logoStyle}
            className={`${buttonType === 'pill' ? 'w-6 h-6' : 'w-8 h-8'} object-contain`}
          />
        )}

        {/* Only render text if visualType is 'full' or 'textOnly' */}
        {(visualType === 'full' || visualType === 'textOnly') && (
          <span className={`${login ? 'text-black' : textColor === 'black' ? 'text-black' : 'text-white'} ${visualType === 'icon' ? 'sr-only' : ''} ${textLayout === 'right' ? 'ml-2' : textLayout === 'left' ? 'mr-2' : ''}`}>
            {getText()}
          </span>
        )}
      </button>
    </div>
  )

}

// export default Onairos;

// module.exports = Onairos;