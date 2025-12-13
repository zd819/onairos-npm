import React, { useEffect, useState, useRef } from 'react';
import Lottie from 'lottie-react';
import rainAnim from '../../public/rain-anim.json';
import io from 'socket.io-client';

const trainingPhrases = [
  "Analyzing your data patterns...",
  "Building your personality model...",
  "Training neural networks...",
  "Running inference algorithms...",
  "Generating personalized insights...",
  "Finalizing your profile...",
  "Almost done..."
];

export default function TrainingScreen({ onComplete, onTrainingStart, userEmail, connectedAccounts = [], userToken }) {
  const [progress, setProgress] = useState(0);
  const [currentPhrase, setCurrentPhrase] = useState(trainingPhrases[0]);
  const [currentStage, setCurrentStage] = useState('training'); // 'training' | 'inference' | 'complete'
  const lottieRef = useRef(null);

  useEffect(() => {
    let socket = null;
    let progressTimer = null;
    let didSignalStart = false;

    const signalTrainingStarted = () => {
      if (didSignalStart) return;
      didSignalStart = true;
      try {
        onTrainingStart?.();
      } catch (e) {
        // never block training due to callback issues
      }
    };
    
    // ACTUALLY run training + inference using Socket.IO
    const runTrainingAndInference = async () => {
      console.log('🎓 Starting REAL training for:', userEmail);
      console.log('📊 Connected accounts:', connectedAccounts);
      console.log('🔑 userToken prop received:', userToken ? `${userToken.substring(0, 20)}...` : 'UNDEFINED');

      try {
        // Use token passed from parent component, fallback to localStorage
        let token = userToken;
        
        if (!token) {
          console.warn('⚠️ Token not passed as prop, checking localStorage...');
          try {
            const storedToken = localStorage.getItem('onairos_user_token');
            if (storedToken) {
              token = storedToken;
              console.log('✅ Found token in localStorage');
            } else {
              const userData = JSON.parse(localStorage.getItem('onairosUser') || '{}');
              token = userData.token;
              if (token) {
                console.log('✅ Found token in onairosUser localStorage');
              }
            }
          } catch (e) {
            console.error('❌ Error reading from localStorage:', e);
          }
        }

        if (!token) {
          console.error('❌ No token found anywhere - cannot run training');
          console.error('💡 Token should be passed from parent component OR stored in localStorage');
          throw new Error('No authentication token');
        }
        
        console.log('✅ Token found, starting Socket.IO training...', token.substring(0, 20) + '...');

        // Phase 1: Connect to Socket.IO
        setCurrentStage('training');
        setCurrentPhrase('Connecting to server...');
        console.log('🔌 Connecting to Socket.IO server...');

        socket = io('https://api2.onairos.uk', {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: false, // Don't reconnect automatically for this one-time operation
          timeout: 60000 // 60 second timeout
        });

        // Handle connection
        socket.on('connect', () => {
          console.log('✅ Socket connected:', socket.id);
          // At this point, training can actually start (server reachable).
          signalTrainingStarted();
          setCurrentPhrase('Starting training...');
          
          // Start progress animation
          progressTimer = setInterval(() => {
            setProgress(prev => {
              if (prev < 95) return prev + 0.5; // Slow smooth progress
              return prev;
            });
          }, 200);

          // Trigger training
          console.log('🚀 Emitting start-training event with:', {
            socketId: socket.id,
            email: userEmail,
            platforms: connectedAccounts
          });

          socket.emit('start-training', {
            socketId: socket.id,
            email: userEmail,
            username: userEmail,
            platforms: connectedAccounts,
            connectedAccounts: connectedAccounts
          });
        });

        // Handle training progress updates
        socket.on('training-progress', (data) => {
          console.log('📊 Training progress:', data);
          // Progress events mean training has definitely started.
          signalTrainingStarted();
          if (data.percentage) {
            setProgress(Math.min(data.percentage, 95)); // Cap at 95% until complete
          }
          if (data.message) {
            setCurrentPhrase(data.message);
          }
          if (data.stage) {
            setCurrentStage(data.stage);
          }
        });

        // Handle training completion
        socket.on('training-complete', (result) => {
          console.log('✅ Training complete via Socket.IO:', result);
          
          if (progressTimer) clearInterval(progressTimer);
          setProgress(100);
          setCurrentStage('complete');
          setCurrentPhrase('Training complete!');

          // Log complete results to console
          console.log('\n🎉 ===== TRAINING + INFERENCE COMPLETE =====\n');
          console.log('📊 Training Results:', {
            status: 'completed',
            userEmail,
            connectedPlatforms: connectedAccounts,
            traits: result.traits || result.trainingResults?.traits || {},
            timestamp: new Date().toISOString()
          });
          
          console.log('\n🧠 Traits Retrieved:', {
            traits: result.traits || result.trainingResults?.traits || {},
            userTraits: result.userTraits || result.trainingResults?.userTraits || {},
            hasLlmData: !!result.llmData,
            inferenceResults: result.inferenceResults || null
          });
          
          console.log('\n✅ Model ready for predictions!\n');

          // Disconnect socket
          socket.disconnect();

          // Complete after short delay
          setTimeout(() => {
            onComplete?.(result);
          }, 500);
        });

        // Handle errors
        socket.on('training-error', (error) => {
          console.error('❌ Training error from Socket.IO:', error);
          
          if (progressTimer) clearInterval(progressTimer);
          
          setProgress(100);
          setCurrentPhrase('Error occurred, continuing...');
          
          socket.disconnect();
          
          setTimeout(() => {
            onComplete?.({ 
              error: error.message || 'Training failed',
              fallback: true 
            });
          }, 500);
        });

        // Handle connection errors
        socket.on('connect_error', (error) => {
          console.error('❌ Socket.IO connection error:', error);
          
          if (progressTimer) clearInterval(progressTimer);
          
          setProgress(100);
          setCurrentPhrase('Connection error, continuing...');
          
          socket.disconnect();
          
          setTimeout(() => {
            onComplete?.({ 
              error: 'Failed to connect to training server',
              fallback: true 
            });
          }, 500);
        });

        // Handle disconnect
        socket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
        });

      } catch (error) {
        console.error('❌ Training/Inference Error:', error);
        
        if (progressTimer) clearInterval(progressTimer);
        if (socket) socket.disconnect();
        
        // Fallback: still complete but show error
        console.warn('⚠️ Falling back to cached data or skipping training');
        setProgress(100);
        setTimeout(() => {
          onComplete?.({ 
            error: error.message,
            fallback: true 
          });
        }, 500);
      }
    };

    runTrainingAndInference();

    // Cleanup on unmount
    return () => {
      if (progressTimer) clearInterval(progressTimer);
      if (socket) {
        console.log('🧹 Cleaning up socket connection');
        socket.disconnect();
      }
    };
  }, [userEmail, connectedAccounts, userToken, onComplete]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
        .glow-bar {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5),
                      0 0 40px rgba(139, 92, 246, 0.3),
                      inset 0 0 20px rgba(255, 255, 255, 0.1);
        }
      `}</style>

      {/* Rain Animation - Sleek and centered */}
      <div className="w-full max-w-sm mb-6 float-animation">
        <Lottie 
          lottieRef={lottieRef}
          animationData={rainAnim}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '240px', filter: 'brightness(1.1)' }}
        />
      </div>

      {/* Training Status - Sleeker design */}
      <div className="w-full max-w-lg">
        {/* Title with stage indicator */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">
              {currentStage === 'training' ? 'Training Model' : 
               currentStage === 'inference' ? 'Running Inference' : 'Complete'}
            </span>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {currentStage === 'complete' ? 'Ready!' : 'Building Your Profile'}
          </h2>
          
          <p className="text-blue-200 text-sm font-medium">
            {currentPhrase}
          </p>
        </div>

        {/* Progress Bar - Sleek glassmorphism design */}
        <div className="relative mb-4">
          <div className="w-full bg-white/5 backdrop-blur-sm rounded-full h-3 overflow-hidden border border-white/10">
            <div 
              className="h-full rounded-full transition-all duration-300 ease-out glow-bar"
              style={{ 
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)'
              }}
            />
          </div>
          
          {/* Progress percentage overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {progress}%
            </span>
          </div>
        </div>

        {/* Stage indicators */}
        <div className="flex justify-between items-center px-2 mb-6">
          <div className={`text-xs font-medium transition-colors ${progress >= 0 ? 'text-blue-400' : 'text-gray-500'}`}>
            Training
          </div>
          <div className={`text-xs font-medium transition-colors ${progress >= 50 ? 'text-purple-400' : 'text-gray-500'}`}>
            Inference
          </div>
          <div className={`text-xs font-medium transition-colors ${progress >= 100 ? 'text-pink-400' : 'text-gray-500'}`}>
            Complete
          </div>
        </div>

        {/* Info box - Sleek and minimal */}
        <div className="mt-6 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
          <div className="flex items-center justify-center gap-2 text-blue-100">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-xs">
              Processing your data securely • {connectedAccounts.length} {connectedAccounts.length === 1 ? 'platform' : 'platforms'} connected
            </p>
          </div>
        </div>        
      </div>
    </div>
  );
}
