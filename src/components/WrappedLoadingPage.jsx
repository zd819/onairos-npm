import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

export default function WrappedLoadingPage() {
  const [animationData, setAnimationData] = useState(null);

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
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Updating your digital brain for 2025...
        </h2>
        <p className="text-sm text-gray-600">
          This may take a few moments
        </p>
      </div>
      
      {animationData ? (
        <div className="w-full max-w-md h-64 flex items-center justify-center">
          <Lottie 
            animationData={animationData}
            loop={true}
            autoplay={true}
            className="w-full h-full"
          />
        </div>
      ) : (
        <div className="w-full max-w-md h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
}

