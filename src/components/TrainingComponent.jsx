import React, { useState, useEffect } from 'react';

export default function TrainingComponent({ onComplete, userEmail, appName = 'App' }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    {
      title: 'Setting up your personal AI',
      description: 'Initializing your secure data model',
      icon: '🤖',
      duration: 2000
    },
    {
      title: 'Processing your connections',
      description: 'Analyzing your social media patterns',
      icon: '🔗',
      duration: 2500
    },
    {
      title: 'Training your model',
      description: 'Building your personalized insights',
      icon: '🧠',
      duration: 3000
    },
    {
      title: 'Finalizing setup',
      description: 'Preparing your Onairos experience',
      icon: '✨',
      duration: 2000
    }
  ];

  useEffect(() => {
    let interval;
    let stepTimeout;

    if (currentStep < steps.length) {
      const stepDuration = steps[currentStep].duration;
      const stepProgress = 100 / steps.length;

      // Update progress gradually
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (stepProgress / (stepDuration / 100));
          return Math.min(newProgress, (currentStep + 1) * stepProgress);
        });
      }, 100);

      // Move to next step after duration
      stepTimeout = setTimeout(() => {
        if (currentStep < steps.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          setIsComplete(true);
          setTimeout(() => {
            onComplete({
              trainingComplete: true,
              timestamp: new Date().toISOString(),
              userEmail: userEmail,
              appName: appName
            });
          }, 1000);
        }
      }, stepDuration);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (stepTimeout) clearTimeout(stepTimeout);
    };
  }, [currentStep, onComplete, userEmail, appName]);

  return (
    <div className="max-w-md mx-auto bg-white p-6 min-h-[400px] flex flex-col justify-center">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="text-3xl">
            {isComplete ? '🎉' : steps[currentStep]?.icon}
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isComplete ? 'All set!' : steps[currentStep]?.title}
        </h2>
        <p className="text-gray-600">
          {isComplete 
            ? 'Your personal AI is ready to use' 
            : steps[currentStep]?.description
          }
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="flex justify-center space-x-2 mb-6">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index <= currentStep 
                ? 'bg-blue-500' 
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Current Step Details */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="text-sm">
              {isComplete ? '✅' : steps[currentStep]?.icon}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {isComplete ? 'Training Complete' : `Step ${currentStep + 1} of ${steps.length}`}
            </h3>
            <p className="text-sm text-gray-600">
              {isComplete 
                ? 'Your Onairos experience is ready' 
                : steps[currentStep]?.description
              }
            </p>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Setting up for <span className="font-medium">{appName}</span>
        </p>
        {userEmail && (
          <p className="text-xs text-gray-400 mt-1">
            {userEmail}
          </p>
        )}
      </div>
    </div>
  );
} 