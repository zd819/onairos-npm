import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

export default function WrappedLoadingPage({ appName }) {
  const [animationData, setAnimationData] = useState(null);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  
  // Only show "Updating your digital brain for 2025..." if app name contains "wrapped"
  const isWrappedApp = appName && appName.toLowerCase().includes('wrapped');

  // Whimsical rotating messages
  const messages = [
    "Reading your mind...",
    "Connecting the dots...",
    "Brewing insights...",
    "Decoding your vibe...",
    "Piecing together your story...",
    "Finding patterns in the chaos...",
    "Translating data to wisdom...",
    "Your digital fingerprint is unique...",
    "Almost done thinking...",
    "Polishing the final details..."
  ];

  useEffect(() => {
    // Fetch the animation JSON from public folder
    fetch('/rain-anim.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => {
        console.error('Failed to load rain animation:', err);
        // Fallback: try from the npm package public folder
        fetch('https://onairos.sirv.com/rain-anim.json')
          .then(res => res.json())
          .then(data => setAnimationData(data))
          .catch(err2 => console.error('Failed to load rain animation from fallback:', err2));
      });
  }, []);

  // Animate progress bar over ~2 minutes (API can take 1-3 minutes)
  useEffect(() => {
    const duration = 120000; // 2 minutes in ms
    const interval = 100; // Update every 100ms
    const increment = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        // Cap at 95% to avoid reaching 100% before API completes
        return next >= 95 ? 95 : next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Rotate messages every 4 seconds
  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(messageTimer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-4">
      {/* Content is centered vertically inside the modal card */}
      <div className="flex flex-col items-center justify-center w-full max-w-2xl space-y-6">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
            {isWrappedApp ? 'Updating your digital brain for 2025...' : 'Processing your data...'}
          </h2>
          <p className="text-xs md:text-sm text-gray-600">
            {isWrappedApp ? 'Crafting your personalized insights from your digital footprint' : 'This will just take a moment'}
          </p>
        </div>

        {/* Lottie Animation */}
        {animationData ? (
          <div className="w-full max-w-sm mx-auto">
            {/* Fixed aspect ratio so the figure sits nicely in the center and never clips */}
            <div className="relative w-full" style={{ paddingBottom: '100%' }}>
              <Lottie 
                animationData={animationData}
                loop={true}
                autoplay={true}
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Black and White Loading Bar - Below Lottie */}
        <div className="w-full max-w-md">
          <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gray-900 rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${progress}%`
              }}
            />
          </div>
          
          {/* Rotating message with fade transition */}
          <p 
            key={messageIndex}
            className="text-center text-xs text-gray-600 mt-3 animate-fadeIn"
            style={{ 
              animation: 'fadeIn 0.5s ease-in-out'
            }}
          >
            {messages[messageIndex]}
          </p>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(-4px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}

