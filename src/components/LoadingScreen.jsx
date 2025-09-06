import React, { useState, useEffect } from "react";

export default function LoadingScreen({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dotCount, setDotCount] = useState(0);

  const loadingStates = [
    { message: "Validating PIN and continuing training", progress: 20 },
    { message: "Uploading model to secure storage", progress: 40 },
    { message: "Running test inference", progress: 60 },
    { message: "Storing results in databases", progress: 80 },
    { message: "Complete!", progress: 100 },
  ];

  useEffect(() => {
    const stateInterval = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = prev + 1;
        if (nextStep >= loadingStates.length) {
          // Loading complete, call onComplete after a short delay
          setTimeout(() => {
            onComplete();
          }, 1000);
          return prev; // Keep at last step
        }
        return nextStep;
      });
    }, 3000); // Change state every 3 seconds

    return () => clearInterval(stateInterval);
  }, [loadingStates.length, onComplete]);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4); // 0, 1, 2, 3 dots
    }, 500); // Change dots every 500ms

    return () => clearInterval(dotInterval);
  }, []);

  const currentState = loadingStates[currentStep];

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-end justify-center">
      {/* Modal - Full height from bottom */}
      <div className="bg-white rounded-t-3xl w-full max-w-sm mx-auto shadow-2xl overflow-hidden h-screen max-h-screen flex flex-col">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 flex-shrink-0">
          <div className="absolute left-6 top-6 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>

          {/* Progress Bar */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-1 bg-gray-300 rounded-full">
              <div className="w-16 h-1 bg-gray-900 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Content - Centered loading state */}
        <div className="flex-1 flex flex-col justify-center items-center px-6">
          <div className="text-center mb-12">
            <h1 className="text-lg font-bold text-gray-900 mb-8 leading-tight">
              {currentState.message}
              {currentState.message !== "Complete!" && (
                <span className="inline-block w-8 text-left">{".".repeat(dotCount)}</span>
              )}
            </h1>

            <div className="w-64 mx-auto">
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-gray-900 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${currentState.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-20 flex-shrink-0"></div>
      </div>
    </div>
  );
}
