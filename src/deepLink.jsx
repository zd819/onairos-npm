import React, { useEffect, useState } from "react";

const DeepLink = () => {
  const [message, setMessage] = useState("No message passed!");
  const [mode, setMode] = useState("default");

  useEffect(() => {
    // Check if Telegram's WebApp object is available
    if (window.Telegram && window.Telegram.WebApp) {
      // Tell Telegram the app is ready
      window.Telegram.WebApp.ready();

      // Access initData
      const initData = window.Telegram.WebApp.initDataUnsafe;
      const startParam = initData?.start_param || "No data found!";
      const modeParam = initData?.mode || "default";

      setMessage(startParam);
      setMode(modeParam);
    } else {
      // Handle case where Telegram SDK is not available
      console.warn("Telegram WebApp is not available!");
      setMessage("Telegram WebApp is not available!");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-4 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold">Welcome to Onairos Mini App</h1>
        <p className="mt-4 text-lg">Message: {message}</p>
        <p className="mt-2 text-sm">Mode: {mode}</p>
      </div>
    </div>
  );
};

export default DeepLink;
