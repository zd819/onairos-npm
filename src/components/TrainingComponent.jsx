import React, { useState, useEffect } from 'react';
import { COLORS } from '../theme/colors.js';

export default function TrainingComponent({ onComplete, userEmail, appName = 'App', testMode = false }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    {
      title: 'Setting up your personal AI',
      description: 'Initializing your secure data model',
      icon: '🤖',
      duration: testMode ? 800 : 2000 // Much faster in test mode
    },
    {
      title: 'Processing your connections',
      description: 'Analyzing your social media patterns',
      icon: '🔗',
      duration: testMode ? 600 : 2500
    },
    {
      title: 'Training your model',
      description: 'Building your personalized insights',
      icon: '🧠',
      duration: testMode ? 700 : 3000
    },
    {
      title: 'Finalizing setup',
      description: 'Preparing your Onairos experience',
      icon: '✨',
      duration: testMode ? 500 : 2000
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
          const completionDelay = testMode ? 400 : 1000; // Faster completion in test mode
          
          if (testMode) {
            console.log('🧪 Test mode: Training simulation completed');
          }
          
          setTimeout(() => {
            onComplete({
              trainingComplete: true,
              timestamp: new Date().toISOString(),
              userEmail: userEmail,
              appName: appName,
              testMode: testMode,
              simulatedTraining: testMode
            });
          }, completionDelay);
        }
      }, stepDuration);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (stepTimeout) clearTimeout(stepTimeout);
    };
  }, [currentStep, onComplete, userEmail, appName]);

  return (
    <div className="w-full flex flex-col items-center space-y-8">
      <div className="text-center">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background: `linear-gradient(135deg, ${COLORS.info}, #8B5CF6)`
          }}
        >
          <div className="text-3xl">
            {isComplete ? '🎉' : steps[currentStep]?.icon}
          </div>
        </div>
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ color: COLORS.textPrimary }}
        >
          {isComplete ? 'All set!' : steps[currentStep]?.title}
        </h2>
        <p style={{ color: COLORS.textSecondary }}>
          {isComplete 
            ? 'Your personal AI is ready to use' 
            : steps[currentStep]?.description
          }
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full">
        <div 
          className="flex justify-between text-sm mb-2"
          style={{ color: COLORS.textSecondary }}
        >
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div 
          className="w-full rounded-full h-2"
          style={{ backgroundColor: COLORS.borderLight }}
        >
          <div 
            className="h-2 rounded-full transition-all duration-300 ease-out"
            style={{ 
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${COLORS.info}, #8B5CF6)`
            }}
          />
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="flex justify-center space-x-2">
        {steps.map((_, index) => (
          <div
            key={index}
            className="w-3 h-3 rounded-full transition-all duration-300"
            style={{
              backgroundColor: index <= currentStep ? COLORS.info : COLORS.border
            }}
          />
        ))}
      </div>

      {/* Current Step Details */}
      <div 
        className="p-4 rounded-lg w-full"
        style={{ backgroundColor: COLORS.backgroundSecondary }}
      >
        <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#DBEAFE' }}
          >
            <div className="text-sm">
              {isComplete ? '✅' : steps[currentStep]?.icon}
            </div>
          </div>
          <div>
            <h3 
              className="font-medium"
              style={{ color: COLORS.textPrimary }}
            >
              {isComplete ? 'Training Complete' : `Step ${currentStep + 1} of ${steps.length}`}
            </h3>
            <p 
              className="text-sm"
              style={{ color: COLORS.textSecondary }}
            >
              {isComplete 
                ? 'Your Onairos experience is ready' 
                : steps[currentStep]?.description
              }
            </p>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="text-center">
        <p 
          className="text-sm"
          style={{ color: COLORS.textSecondary }}
        >
          Setting up for <span className="font-medium">{appName}</span>
        </p>
        {userEmail && (
          <p 
            className="text-xs mt-1"
            style={{ color: COLORS.textMuted }}
          >
            {userEmail}
          </p>
        )}
      </div>
    </div>
  );
} 