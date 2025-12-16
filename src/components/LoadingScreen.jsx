import React, { useState, useEffect } from "react";
import Lottie from 'lottie-react';
import rainAnim from '../../public/rain-anim.json';

export default function LoadingScreen({ onComplete, appName }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev; // Cap at 95% until onComplete is called
        return prev + 1;
      });
    }, 150); // Smooth increment every 150ms

    // Auto-complete after reasonable time (fallback)
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, 15000); // 15 seconds fallback

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-6 py-4">
      {/* Fixed layout container to match TrainingScreen */}
      <div
        className="w-full max-w-md flex flex-col items-center"
        style={{
          minHeight: 520,
          justifyContent: 'center',
          gap: 18
        }}
      >
        {/* Header */}
        <div className="text-center" style={{ minHeight: 56, display: 'flex', alignItems: 'center' }}>
          <h2
            className="text-xl md:text-2xl font-semibold text-gray-900"
            style={{
              fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
              lineHeight: 1.2,
              maxWidth: 360
            }}
          >
            Finalizing...
          </h2>
        </div>

        {/* Lottie Animation */}
        <div className="w-full flex items-center justify-center" style={{ height: 300 }}>
          <div className="relative" style={{ width: 300, height: 300 }}>
            <Lottie
              animationData={rainAnim}
              loop={true}
              autoplay={true}
              className="absolute inset-0"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* Black and White Loading Bar */}
        <div className="w-full" style={{ maxWidth: 360 }}>
          <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gray-900 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
