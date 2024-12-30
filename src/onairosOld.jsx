import React, { useEffect, useState } from 'react';
import { Othent, AppInfo } from "@othent/kms";
import { rsaEncrypt } from './RSA';
import getPin from './getPin';

const loadSha256 = async () => {
  const module = await import(/* webpackChunkName: "sha256" */ 'crypto-js/sha256');
  return module.default;
};

export function Onairos({
  requestData, 
  webpageName, 
  inferenceData = null, 
  onComplete = null, 
  autoFetch = true, // Added
  proofMode = false, 
  textLayout = 'below', 
  textColor = 'white',
  login = false,
  buttonType = 'pill',
  loginReturn = null,
  loginType = 'signIn', // New prop: signIn, signUp, signOut
  visualType = 'full', // New prop: full, icon, textOnly
}) {
  const [userData, setUserData] = useState(null);

  // Detect if the user is on a mobile device
  const isMobileDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|iphone|ipad|ipod|windows phone/i.test(userAgent);
  };

  // Detect if the user is on a Telegram mini app
  const isTelegramMiniApp = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return typeof window.Telegram !== 'undefined' && /telegram/i.test(userAgent) && /mobile/i.test(navigator.userAgent);
  };

  const generateRandomData = (structure) => {
    const generateRandomNumbers = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map((item) => generateRandomNumbers(item));
      } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
          acc[key] = generateRandomNumbers(obj[key]);
          return acc;
        }, {});
      } else {
        return Math.random();
      }
    };
    return generateRandomNumbers(structure);
  };

  const handleAPIRequestForMobile = async () => {
    if (isMobileDevice()) {
      if (autoFetch) {
        const randomData = generateRandomData(inferenceData);
        onComplete(randomData);
      } else {
        window.postMessage({
          type: 'API_URL_RESPONSE',
          APIurl: 'https://onairos.uk/capx',
          source: 'content-script',
          approved: "message.approved",
          accessToken: "message.accessToken",
          unique:"Onairos-Response",
          username:"CapX-Telegram"
        }, '*');
      }
    }
  };

  const validateRequestData = () => {
    const validKeys = ['Small', 'Medium', 'Large'];
    const requiredProperties = ['type', 'descriptions', 'reward'];
    if (typeof webpageName !== 'string') {
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
  };

  const ConnectOnairos = async () => {
    try {
      // if (isMobileDevice()) {
      //   await handleAPIRequestForMobile();

      //   return;
      // }

      console.log("Connecting to Onairos");
      const appInfo = {
        name: "Onairos",
        version: "1.0.0",
        env: "production",
      };
      const othent = new Othent({ appInfo, throwErrors: false });
      const userDetails = await othent.connect();
      const sha256 = await loadSha256();
      const hashedOthentSub = sha256(userDetails.sub).toString();
      const encryptedPin = await getPin(hashedOthentSub);

      function convertToBuffer(string) {
        try {
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
      const userPin = await othent.decrypt(bufferPIN);
      console.log("Retrieved PIN Working");
      rsaEncrypt(OnairosPublicKey, userPin)
        .then(encryptedData => {
          window.postMessage({
            source: 'webpage',
            type: 'GET_API_URL',
            webpageName: webpageName,
            domain: domain,
            requestData: requestData,
            proofMode: proofMode,
            HashedOthentSub: hashedOthentSub,
            EncryptedUserPin: encryptedData
          });
        })
        .catch(error => {
          console.error("Encryption failed:", error);
        });

    } catch (e) {
      console.error({ fix: "Please ensure you have stored your model" });
      console.error("Error Sending Data to Terminal: ", e);
    }
  };

  // Styling and button class based on visual type and login mode
  const buttonClass = 
    `OnairosConnect flex items-center justify-center font-bold rounded cursor-pointer ${
    buttonType === 'pill' ? 'px-4 py-2' : 'w-12 h-12'
    } ${login ? 'bg-white border border-gray-300' : 'bg-transparent'}`;

  const buttonStyle = {
    flexDirection: textLayout === 'below' ? 'column' : 'row',
    backgroundColor: login ? '#ffffff' : 'transparent',
    color: login ? 'black' : textColor,
    border: login ? '1px solid #ddd' : '1px solid transparent',
  };

  const logoStyle = {
    width: '20px',
    height: '20px',
    marginRight: visualType === 'full' ? '12px' : '0', // Space between icon and text only in full mode
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
    <div className="flex items-center justify-center">
      <button
        className={buttonClass}
        onClick={ConnectOnairos} 
        // validateRequestData();
            // await ConnectOnairos();
        style={buttonStyle}
      >
        {(visualType === 'full' || visualType === 'icon') && (
          <img
            src={login ? "https://onairos.sirv.com/Images/OnairosWhite.png" : "https://onairos.sirv.com/Images/OnairosBlack.png"}
            alt="Onairos Logo"
            style={logoStyle}
            className={`${buttonType === 'pill' ? 'w-6 h-6' : 'w-8 h-8'} object-contain`}
          />
        )}
        {(visualType === 'full' || visualType === 'textOnly') && (
          <span className={`${login ? 'text-black' : textColor === 'black' ? 'text-black' : 'text-white'} ${visualType === 'icon' ? 'sr-only' : ''} ${textLayout === 'right' ? 'ml-2' : textLayout === 'left' ? 'mr-2' : ''}`}>
            {getText()}
          </span>
        )}
      </button>
    </div>
  );
}
