import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

export default function WrappedLoadingPage({ appName }) {
  // CRITICAL: Do not render anything for non-wrapped apps
  // This component should NEVER be called for non-wrapped apps
  const isWrappedApp = appName && appName.toLowerCase().includes('wrapped');
  
  if (!isWrappedApp) {
    console.warn('⚠️ WrappedLoadingPage should not be rendered for non-wrapped app:', appName);
    return null;
  }
  
  const [animationData, setAnimationData] = useState(null);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  // Whimsical rotating messages
  const messages = [
    "Reading your mind...",
    "Connecting the dots...",
    "Brewing insights...",
    "Decoding your vibe...",
    "Piecing together your story...",
    "Finding patterns in the chaos...",
    "Translating data to wisdom...",
    "Analyzing your digital footprint...",
    "Your digital fingerprint is unique...",
    "Generating personalized metrics...",
    "Almost done thinking...",
    "Polishing the final details...",
    "Applying finishing touches...",
    "Preparing your wrapped report..."
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
    <div className="flex flex-col items-center justify-center h-full px-4 py-4 md:px-6 overflow-hidden">
      {/* Content is centered vertically inside the modal card */}
      <div className="flex flex-col items-center justify-center w-full max-w-2xl space-y-2 md:space-y-4 h-full max-h-[600px]">
        {/* Title */}
        <div className="text-center flex-shrink-0 mt-0">
          <h2 className="text-lg md:text-2xl font-semibold text-gray-900 mb-1">
            {isWrappedApp ? 'Updating your digital brain for 2025...' : 'Processing your data...'}
          </h2>
          <p className="text-xs md:text-sm text-gray-600 px-4">
            {isWrappedApp ? 'Crafting your personalized insights from your digital footprint' : 'This will just take a moment'}
          </p>
        </div>

        {/* Lottie Animation */}
        {animationData ? (
          <div className="w-full max-w-[200px] md:max-w-[260px] mx-auto flex-shrink-1 min-h-0 aspect-square flex items-center justify-center">
            <Lottie 
              animationData={animationData}
              loop={true}
              autoplay={true}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="w-full max-w-sm h-32 md:h-48 flex items-center justify-center flex-shrink-0">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Black and White Loading Bar - Below Lottie */}
        <div className="w-full max-w-md px-2 flex-shrink-0">
          <div className="flex justify-between text-xs font-medium text-gray-600 mb-2 px-1">
             <span>Analyzing data...</span>
             <span>{Math.round(progress)}%</span>
          </div>
          
          <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden border border-gray-100 shadow-inner">
            <div 
              className="absolute top-0 left-0 h-full bg-gray-900 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
              style={{ 
                width: `${progress}%`
              }}
            >
              {/* Optional: Add a subtle shine/pulse effect */}
              <div className="w-full h-full absolute inset-0 bg-white/10 animate-pulse"></div>
            </div>
          </div>
          
          {/* Rotating message with fade transition */}
          <div className="h-8 mt-4 flex items-center justify-center">
            <p 
              key={messageIndex}
              className="text-center text-sm font-semibold text-gray-800 animate-fadeIn"
              style={{ 
                animation: 'fadeIn 0.5s ease-in-out'
              }}
            >
              {messages[messageIndex]}
            </p>
          </div>
          
          {/* Explicit wait message - Minimal Design */}
          <div className="mt-5 flex flex-col items-center gap-1.5 max-w-sm mx-auto">
            <div className="h-px w-12 bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-1.5"></div>
            <p className="text-xs text-gray-600 text-center leading-relaxed font-medium">
              This runs a complex AI model and takes about 1-3 minutes.
            </p>
            <p className="text-xs text-gray-600 text-center font-medium">
              Feel free to grab a coffee while we cook! ☕️
            </p>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(-4px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}

