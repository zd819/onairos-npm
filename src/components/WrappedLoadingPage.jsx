import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

export default function WrappedLoadingPage({ appName }) {
  const [animationData, setAnimationData] = useState(null);
  const [progress, setProgress] = useState(0);
  
  // Only show "Updating your digital brain for 2025..." if app name contains "wrapped"
  const isWrappedApp = appName && appName.toLowerCase().includes('wrapped');

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

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-4">
      {/* Content is centered vertically inside the modal card */}
      <div className="flex flex-col items-center justify-center w-full max-w-2xl space-y-4 md:space-y-6">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
            {isWrappedApp ? 'Updating your digital brain for 2025...' : 'Processing your data...'}
          </h2>
          <p className="text-xs md:text-sm text-gray-600">
            {isWrappedApp ? 'Crafting your personalized insights from your digital footprint' : 'This will just take a moment'}
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-full max-w-md">
          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${progress}%`,
                boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
              }}
            />
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            {progress < 30 ? 'Analyzing your data...' : 
             progress < 60 ? 'Generating insights...' : 
             progress < 90 ? 'Almost there...' : 
             'Finalizing your wrapped...'}
          </p>
        </div>

        {animationData ? (
          <div className="w-full max-w-md mx-auto">
            {/* Fixed aspect ratio so the figure sits nicely in the center and never clips */}
            <div className="relative w-full" style={{ paddingBottom: '120%' }}>
              <Lottie 
                animationData={animationData}
                loop={true}
                autoplay={true}
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>
    </div>
  );
}

