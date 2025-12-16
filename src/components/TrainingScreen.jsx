import React, { useEffect, useState, useRef } from 'react';
import Lottie from 'lottie-react';
import rainAnim from '../../public/rain-anim.json';
import io from 'socket.io-client';

const trainingPhrases = [
  "Training your data...",
  "Gathering your traits...",
  "Building your profile...",
  "Analyzing patterns...",
  "Creating insights...",
  "Finalizing...",
  "Almost done..."
];

export default function TrainingScreen({ onComplete, onTrainingStart, userEmail, connectedAccounts = [], userToken }) {
  const [progress, setProgress] = useState(0);
  const [currentPhrase, setCurrentPhrase] = useState(trainingPhrases[0]);
  const lottieRef = useRef(null);

  useEffect(() => {
    let socket = null;
    let progressTimer = null;
    let didSignalStart = false;
    let watchdogTimer = null;
    let phraseTimer = null;
    let phraseIndex = 0;

    const signalTrainingStarted = () => {
      if (didSignalStart) return;
      didSignalStart = true;
      try {
        onTrainingStart?.();
      } catch (e) {
        // never block training due to callback issues
      }
    };

    // UI should stay vague; do NOT surface backend trainingUpdate/status strings.
    const startVaguePhraseRotation = () => {
      if (phraseTimer) return;
      phraseTimer = setInterval(() => {
        phraseIndex = (phraseIndex + 1) % trainingPhrases.length;
        setCurrentPhrase(trainingPhrases[phraseIndex]);
      }, 4000);
    };

    const resetWatchdog = () => {
      // We keep a long watchdog to avoid infinite hangs, but we do not scare the user
      // and we do not auto-complete while backend is actively sending updates.
      if (watchdogTimer) clearTimeout(watchdogTimer);
      watchdogTimer = setTimeout(() => {
        // Silent timeout -> complete with fallback so flow can proceed,
        // but keep UI vague.
        try { if (progressTimer) clearInterval(progressTimer); } catch {}
        setProgress(100);
        setCurrentPhrase('Finalizing...');
        try { if (socket) socket.disconnect(); } catch {}
        setTimeout(() => {
          onComplete?.({
            fallback: true,
            message: 'Training timed out (watchdog)',
            autoCompleted: true
          });
        }, 800);
      }, 10 * 60 * 1000); // 10 minutes
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
        setCurrentPhrase(trainingPhrases[0]);
        startVaguePhraseRotation();
        resetWatchdog();
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
          startVaguePhraseRotation();
          resetWatchdog();
          
          // Start progress animation (slow + steady; completion comes from backend event)
          progressTimer = setInterval(() => {
            setProgress(prev => {
              if (prev < 95) return prev + 0.5; // Slower progress
              return prev;
            });
          }, 300);

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
          resetWatchdog();
        });

        // Handle training progress updates
        socket.on('training-progress', (data) => {
          console.log('📊 Training progress:', data);
          // Progress events mean training has definitely started.
          signalTrainingStarted();
          startVaguePhraseRotation();
          resetWatchdog();
          
          if (data.percentage) {
            setProgress(Math.min(data.percentage, 95)); // Cap at 95% until complete
          }
        });

        // Handle training updates (legacy event name from old mobile SDK)
        socket.on('trainingUpdate', (data) => {
          console.log('📊 Training update:', data);
          // We are receiving backend updates; reset watchdog so we don't timeout mid-training.
          startVaguePhraseRotation();
          resetWatchdog();
          
          // Check if this is an error
          if (data.error) {
            console.error('❌ Training error from trainingUpdate event:', data);
            
            if (progressTimer) clearInterval(progressTimer);
            if (watchdogTimer) clearTimeout(watchdogTimer);
            if (phraseTimer) clearInterval(phraseTimer);
            
            // Check if it's insufficient data error
            if (data.code === 'INSUFFICIENT_DATA') {
              console.error('❌ INSUFFICIENT DATA:', {
                upvoted: data.details?.upvotedCount || 0,
                downvoted: data.details?.downvotedCount || 0,
                total: data.details?.totalCount || 0
              });
              console.error('💡 Suggestions:', data.details?.suggestions || []);
            }
            
            setProgress(100);
            setCurrentPhrase('Finalizing...');
            
            socket.disconnect();
            
            setTimeout(() => {
              // Complete anyway with fallback flag
              onComplete?.({ 
                error: data.error,
                errorCode: data.code,
                errorDetails: data.details,
                fallback: true 
              });
            }, 500);
            return;
          }
        });

        // Handle old training completion event (trainingCompleted)
        socket.on('trainingCompleted', (result) => {
          console.log('✅ Training completed via trainingCompleted event:', result);
          
          // Clear timers
          if (progressTimer) clearInterval(progressTimer);
          if (watchdogTimer) clearTimeout(watchdogTimer);
          if (phraseTimer) clearInterval(phraseTimer);
          
          setProgress(100);
          setCurrentPhrase('Finalizing...');
          
          socket.disconnect();
          
          setTimeout(() => {
            onComplete?.(result || { success: true, fallback: false });
          }, 500);
        });

        // Handle training completion
        socket.on('training-complete', (result) => {
          console.log('✅ Training complete via Socket.IO:', result);
          
          // Clear timers
          if (progressTimer) clearInterval(progressTimer);
          if (watchdogTimer) clearTimeout(watchdogTimer);
          if (phraseTimer) clearInterval(phraseTimer);
          
          setProgress(100);
          setCurrentPhrase('Finalizing...');

          // Log complete results to console with detailed formatting
          const traits = result?.traits || result?.userTraits || {};
          import('../utils/apiResponseLogger.js').then(logger => {
            const responseData = {
              InferenceResult: {
                traits: {
                  personality_traits: traits
                },
                output: result.inferenceResults?.output || []
              },
              inference_metadata: {
                source: 'TrainingScreen',
                completionType: 'socket-event'
              }
            };
            logger.logOnairosResponse(responseData, 'Socket: training-complete', { detailed: true });
          }).catch(e => {
            // Fallback logging if dynamic import fails
            console.log('\n🎉 ===== TRAINING + INFERENCE COMPLETE =====\n');
            console.log(JSON.stringify(result, null, 2));
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
          if (watchdogTimer) clearTimeout(watchdogTimer);
          if (phraseTimer) clearInterval(phraseTimer);
          
          setProgress(100);
          setCurrentPhrase('Finalizing...');
          
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
          if (watchdogTimer) clearTimeout(watchdogTimer);
          if (phraseTimer) clearInterval(phraseTimer);
          
          setProgress(100);
          setCurrentPhrase('Finalizing...');
          
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
        if (watchdogTimer) clearTimeout(watchdogTimer);
        if (phraseTimer) clearInterval(phraseTimer);
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
      if (watchdogTimer) clearTimeout(watchdogTimer);
      if (phraseTimer) clearInterval(phraseTimer);
      if (socket) {
        console.log('🧹 Cleaning up socket connection');
        socket.disconnect();
      }
    };
  }, [userEmail, connectedAccounts, userToken, onComplete]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-6 py-4">
      {/* Fixed layout container to prevent shifting when phrases change */}
      <div
        className="w-full max-w-md flex flex-col items-center"
        style={{
          // Keep consistent vertical rhythm across devices
          minHeight: 520,
          justifyContent: 'center',
          gap: 18
        }}
      >
        {/* Vague message only (never show backend training/inference details) */}
        <div className="text-center" style={{ minHeight: 56, display: 'flex', alignItems: 'center' }}>
          <h2
            className="text-xl md:text-2xl font-semibold text-gray-900"
            style={{
              fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
              lineHeight: 1.2,
              maxWidth: 360
            }}
          >
            {currentPhrase}
          </h2>
        </div>

        {/* Lottie Animation */}
        <div className="w-full flex items-center justify-center" style={{ height: 300 }}>
          <div className="relative" style={{ width: 300, height: 300 }}>
            <Lottie 
              lottieRef={lottieRef}
              animationData={rainAnim}
              loop={true}
              autoplay={true}
              className="absolute inset-0"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* Black and White Loading Bar - Below Lottie */}
        <div className="w-full" style={{ maxWidth: 360 }}>
          <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gray-900 rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${progress}%`
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
