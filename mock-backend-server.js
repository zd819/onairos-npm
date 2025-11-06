/**
 * Mock Backend Server for Testing Onairos SDK Flow
 * Simulates all backend endpoints without touching the real CDK server
 * 
 * Run: node mock-backend-server.js
 * Then test your SDK against http://localhost:3001
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { spawn } from 'child_process';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-sdk-version', 'x-sdk-environment']
}));
app.use(bodyParser.json());

// In-memory storage
const users = new Map();
const verificationCodes = new Map();
const trainingJobs = new Map();

// Utility: Generate mock JWT
function generateMockJWT(email) {
  return `mock-jwt-${Buffer.from(email).toString('base64')}-${Date.now()}`;
}

// ============================================
// EMAIL VERIFICATION
// ============================================

app.post('/email/verify', (req, res) => {
  const { email } = req.body;
  console.log(`📧 [EMAIL] Verification request for: ${email}`);
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + 30 * 60 * 1000,
    attempts: 0
  });
  
  console.log(`📨 [EMAIL] Code sent: ${code}`);
  
  res.json({
    success: true,
    message: 'Verification code sent',
    code // In real backend, this wouldn't be returned
  });
});

app.post('/email/verify/confirm', (req, res) => {
  const { email, code } = req.body;
  console.log(`✅ [EMAIL] Verification confirm for: ${email}, code: ${code}`);
  
  const stored = verificationCodes.get(email.toLowerCase());
  if (!stored || stored.code !== code) {
    return res.status(400).json({
      success: false,
      error: 'Invalid verification code'
    });
  }
  
  // Create/update user
  const jwt = generateMockJWT(email);
  users.set(email, {
    email,
    userName: email,
    verified: true,
    accounts: {},
    pinCreated: false,
    trainingCompleted: false
  });
  
  console.log(`✅ [EMAIL] User verified: ${email}`);
  
  res.json({
    success: true,
    token: jwt,
    user: {
      email,
      userName: email,
      verified: true
    }
  });
});

// ============================================
// OAUTH (LinkedIn, YouTube, Reddit)
// ============================================

const platforms = ['linkedin', 'youtube', 'reddit', 'pinterest', 'github'];

platforms.forEach(platform => {
  app.post(`/${platform}/authorize`, (req, res) => {
    const { session } = req.body;
    console.log(`🔗 [OAUTH] ${platform} authorize for: ${session.username}`);
    
    res.json({
      [`${platform}URL`]: `http://localhost:${PORT}/${platform}/callback?code=mock-code&state=mock-state`
    });
  });
  
  app.get(`/${platform}/callback`, (req, res) => {
    const { code, state } = req.query;
    console.log(`✅ [OAUTH] ${platform} callback - code: ${code}`);
    
    // Mock: extract username from state (in real backend, state is base64 encoded)
    // For testing, we'll just use the first user
    const user = Array.from(users.values())[0];
    if (user) {
      user.accounts[platform] = {
        connected: true,
        connectedAt: new Date().toISOString()
      };
      console.log(`✅ [OAUTH] ${platform} connected for: ${user.email}`);
    }
    
    // Redirect to success close page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Successful</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container { text-align: center; }
          h1 { font-size: 32px; margin-bottom: 10px; }
          p { font-size: 16px; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ ${platform.charAt(0).toUpperCase() + platform.slice(1)} Connected!</h1>
          <p>This window will close automatically...</p>
        </div>
        <script>
          setTimeout(() => {
            window.close();
            if (window.opener) window.opener.postMessage({ type: 'oauth-success', platform: '${platform}' }, '*');
          }, 1500);
        </script>
      </body>
      </html>
    `);
  });
});

// ============================================
// PIN STORAGE (triggers TRAINING)
// ============================================

app.post('/store-pin/web', async (req, res) => {
  const { username, pin } = req.body;
  console.log(`🔐 [PIN] Storing PIN for: ${username}`);
  
  const user = users.get(username);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  user.pinCreated = true;
  user.encryptedPin = `encrypted-${pin}`;
  
  console.log(`✅ [PIN-STORAGE] PIN stored successfully for user: ${username}`);
  
  // Check for connected platforms
  const connectedPlatforms = Object.keys(user.accounts || {});
  let trainingStarted = false;
  
  if (connectedPlatforms.length > 0) {
    console.log(`🚀 [AUTO-TRAINING] User has ${connectedPlatforms.length} connected platform(s): ${connectedPlatforms.join(', ')}`);
    console.log(`✅ [AUTO-TRAINING] Found data files (mocked)`);
    console.log(`🚀 [AUTO-TRAINING] Starting direct training for ${username} after PIN creation (like Enoch)`);
    
    // Simulate training process
    const jobId = `training-${username}-${Date.now()}`;
    trainingJobs.set(jobId, {
      username,
      status: 'running',
      startedAt: Date.now()
    });
    
    // Simulate training completion after 5 seconds
    setTimeout(() => {
      console.log(`✅ [AUTO-TRAINING] Training completed successfully for ${username}`);
      user.trainingCompleted = true;
      trainingJobs.get(jobId).status = 'completed';
      trainingJobs.get(jobId).completedAt = Date.now();
    }, 5000);
    
    trainingStarted = true;
    console.log(`✅ [AUTO-TRAINING] Training process started for ${username} (Job: ${jobId})`);
  } else {
    console.log(`ℹ️ [AUTO-TRAINING] User ${username} has no connected platforms yet - skipping auto-training`);
  }
  
  res.json({
    success: true,
    message: 'PIN stored successfully',
    timestamp: new Date().toISOString(),
    training: trainingStarted ? {
      started: true,
      method: 'direct',
      message: 'Training started directly (like Enoch)'
    } : {
      started: false,
      reason: 'No connected platforms'
    }
  });
});

// ============================================
// DATA REQUEST / INFERENCE
// ============================================

app.post('/getAPIurlMobile', async (req, res) => {
  const { Info } = req.body;
  const { confirmations, account } = Info;
  
  console.log(`📋 [DATA-REQUEST] Request from: ${account}`);
  console.log(`📋 [DATA-REQUEST] Confirmations:`, confirmations.map(c => c.data).join(', '));
  
  const user = users.get(account);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Determine inference endpoint based on confirmations
  const hasTraits = confirmations.some(c => c.data === 'Traits');
  const hasPersonality = confirmations.some(c => c.data === 'Large' || c.data === 'Medium' || c.data === 'Small');
  
  let apiUrl;
  if (hasTraits && hasPersonality) {
    apiUrl = `http://localhost:${PORT}/combined-inference`;
  } else if (hasTraits) {
    apiUrl = `http://localhost:${PORT}/traits`;
  } else if (hasPersonality) {
    apiUrl = `http://localhost:${PORT}/inferenceNoProof`;
  }
  
  console.log(`📡 [DATA-REQUEST] Returning inference endpoint: ${apiUrl}`);
  
  // Generate mock JWT token
  const token = generateMockJWT(account);
  
  res.json({
    apiUrl,
    token
  });
});

// ============================================
// INFERENCE ENDPOINTS
// ============================================

app.post('/combined-inference', async (req, res) => {
  const { Info } = req.body;
  const username = Info?.username;
  
  console.log(`🎯 [INFERENCE] Combined inference for: ${username}`);
  
  const user = users.get(username);
  if (!user || !user.trainingCompleted) {
    return res.status(400).json({
      error: 'Training not completed. Please train your model first.'
    });
  }
  
  // Mock inference result
  const inferenceResult = {
    output: Array.from({ length: 16 }, () => [Math.random()]),
    traits: {
      personality_traits: {
        positive_traits: {
          creativity: 85.5,
          empathy: 78.2,
          leadership: 72.8,
          analytical_thinking: 88.9,
          communication: 81.3
        },
        traits_to_improve: {
          patience: 45.2,
          time_management: 52.7,
          delegation: 38.9
        }
      }
    }
  };
  
  console.log(`✅ [INFERENCE] Inference completed for: ${username}`);
  
  res.json({
    InferenceResult: inferenceResult
  });
});

app.post('/inferenceUsername', async (req, res) => {
  const { Info } = req.body;
  const username = Info?.username;
  
  console.log(`🎯 [INFERENCE] FinalMLP inference for: ${username}`);
  
  const user = users.get(username);
  if (!user || !user.trainingCompleted) {
    return res.status(400).json({
      error: 'Training not completed. Please train your model first.'
    });
  }
  
  // Mock inference result
  const inferenceResult = {
    output: Array.from({ length: 16 }, () => [Math.random()])
  };
  
  console.log(`✅ [INFERENCE] Inference completed for: ${username}`);
  
  res.json({
    InferenceResult: inferenceResult
  });
});

app.post('/traits', async (req, res) => {
  const username = req.body?.Info?.username;
  console.log(`🧠 [TRAITS] Traits request for: ${username}`);
  
  res.json({
    traits: {
      personality_traits: {
        positive_traits: {
          creativity: 85.5,
          empathy: 78.2,
          leadership: 72.8
        },
        traits_to_improve: {
          patience: 45.2,
          time_management: 52.7
        }
      }
    }
  });
});

// ============================================
// CONNECTED ACCOUNTS
// ============================================

app.get('/connected-accounts', (req, res) => {
  const { username } = req.query;
  const user = users.get(username);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const connectedAccounts = Object.entries(user.accounts || {}).map(([platform, data]) => ({
    platform: platform.charAt(0).toUpperCase() + platform.slice(1),
    accountName: `${platform} Account`,
    connectedAt: data.connectedAt,
    status: 'active',
    hasData: true
  }));
  
  res.json({ connectedAccounts });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log('🚀 Mock Backend Server Running');
  console.log('🚀 ========================================');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log('   POST /email/verify');
  console.log('   POST /email/verify/confirm');
  console.log('   POST /{platform}/authorize (linkedin, youtube, reddit, etc.)');
  console.log('   GET  /{platform}/callback');
  console.log('   POST /store-pin/web');
  console.log('   POST /getAPIurlMobile');
  console.log('   POST /combined-inference');
  console.log('   POST /inferenceUsername');
  console.log('   POST /traits');
  console.log('   GET  /connected-accounts');
  console.log('   GET  /health');
  console.log('');
  console.log('💡 Usage:');
  console.log('   1. In internship-demo, set: window.onairosBaseUrl = "http://localhost:3001"');
  console.log('   2. Set: window.onairosApiKey = "test-key"');
  console.log('   3. Run your SDK flow and watch the logs here!');
  console.log('');
  console.log('🎯 Training triggers after PIN creation (5s delay)');
  console.log('🎯 Inference triggers after data request closes');
  console.log('');
});



