import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

export default function WrappedLoadingPage({ appName }) {
  const [animationData, setAnimationData] = useState(null);
  
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

