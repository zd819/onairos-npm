# Backend Socket.IO Setup Guide for Web SDK Training

## 🎯 Problem

The web SDK is now connecting to Socket.IO successfully:
```javascript
✅ Socket connected: PFSQjlCMIjaaT0iyAAAH
🚀 Emitting start-training event
```

But **nothing happens** because the backend isn't listening for Socket.IO events yet!

---

## 🔧 What the Backend Needs to Do

The backend already has Socket.IO infrastructure for mobile apps, but it needs to be **enabled and configured** to handle web SDK connections.

### Current State:
- ✅ Socket.IO imported in `app.js` (line 109)
- ❌ Socket.IO initialization **commented out** (lines 364-366)
- ✅ Mobile training logic exists in `/routes/mobileTraining.js`
- ❌ No event listeners for `start-training` event

---

## 📝 Step-by-Step Setup

### Step 1: Uncomment Socket.IO in `app.js`

**File:** `/Users/anushkajogalekar/onairos/TempBackend/src/app.js`

**Find (lines 362-366):**
```javascript
// Socket Initialization

// // Create Socket Instance
// const server = http.createServer(app);
// const io = new Server(server);
```

**Replace with:**
```javascript
// Socket Initialization

// Create Socket Instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for now (restrict in production)
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store io instance on app for routes to access
app.set('io', io);
app.set('activeProcesses', {}); // Track active training processes

console.log('✅ Socket.IO server initialized');
```

---

### Step 2: Add Socket.IO Event Handlers

**Add this code AFTER the Socket.IO initialization (before route imports):**

```javascript
// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('🔌 New socket connection:', socket.id);
  
  // Authenticate socket connection
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log('❌ Socket connection rejected: No auth token');
    socket.emit('training-error', { message: 'Authentication required' });
    socket.disconnect();
    return;
  }
  
  console.log('✅ Socket authenticated:', socket.id);
  
  // Handle training start event
  socket.on('start-training', async (data) => {
    console.log('🚀 Received start-training event:', {
      socketId: data.socketId,
      email: data.email,
      platforms: data.platforms || data.connectedAccounts
    });
    
    try {
      // Import User model if not already imported
      const { User } = await import('./Mongoose/models.js');
      const { cleanMobileTrainModel } = await import('./routes/mobileTrainModel.js');
      
      // Verify user exists
      const username = data.email || data.username;
      const user = await User.findOne({ email: username });
      
      if (!user) {
        console.log('❌ User not found:', username);
        socket.emit('training-error', { message: 'User not found' });
        return;
      }
      
      console.log('✅ User found:', username);
      
      // Prepare training data (same format as mobile)
      const trainingData = {
        Info: {
          username: username,
          connectedPlatforms: data.platforms || data.connectedAccounts || []
        }
      };
      
      // Get active processes tracker
      const activeProcesses = app.get('activeProcesses') || {};
      
      // Check if user already has active training
      if (activeProcesses[username]) {
        console.log('⚠️ Training already in progress for:', username);
        socket.emit('training-error', { 
          message: 'Training already in progress' 
        });
        return;
      }
      
      console.log('🎯 Starting clean training for:', username);
      
      // Send initial progress update
      socket.emit('training-progress', {
        percentage: 10,
        message: 'Initializing training...',
        stage: 'training'
      });
      
      // Start training process (runs in background)
      cleanMobileTrainModel(socket, io, trainingData, activeProcesses)
        .then((result) => {
          console.log('✅ Training completed for:', username);
          
          // Send completion event with results
          socket.emit('training-complete', {
            success: true,
            traits: result.traits || user.personality_traits || {},
            userTraits: user.personality_traits || {},
            trainingResults: result,
            message: 'Training completed successfully'
          });
        })
        .catch((error) => {
          console.error('❌ Training failed for:', username, error);
          socket.emit('training-error', {
            message: error.message || 'Training failed'
          });
        });
        
    } catch (error) {
      console.error('❌ Error handling start-training:', error);
      socket.emit('training-error', {
        message: error.message || 'Internal server error'
      });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', socket.id, 'Reason:', reason);
  });
});

console.log('✅ Socket.IO event handlers registered');
```

---

### Step 3: Update Server Export

**Find the bottom of `app.js` where it exports:**
```javascript
export default app;
```

**Replace with:**
```javascript
// Export both app and server (for Socket.IO)
export default app;
export { server, io };
```

---

### Step 4: Update Server Start Script

**File:** `/Users/anushkajogalekar/onairos/TempBackend/bin/www` or wherever the server starts

**Find:**
```javascript
const server = http.createServer(app);
server.listen(port);
```

**Replace with:**
```javascript
// Import server from app (which has Socket.IO attached)
import { server } from '../src/app.js';

// If server is undefined (Socket.IO not enabled), create basic HTTP server
const finalServer = server || http.createServer(app);
finalServer.listen(port);
```

---

## 🧪 Testing the Setup

### 1. Restart the Backend

```bash
cd /Users/anushkajogalekar/onairos/TempBackend
npm restart
# or
node src/app.js
# or however you start the backend
```

### 2. Check Console Logs

You should see:
```
✅ Socket.IO server initialized
✅ Socket.IO event handlers registered
Server listening on port 3000
```

### 3. Test from Web SDK

When a user goes through training, you should see:
```
🔌 New socket connection: ABC123XYZ
✅ Socket authenticated: ABC123XYZ
🚀 Received start-training event: {...}
✅ User found: user@example.com
🎯 Starting clean training for: user@example.com
✅ Training completed for: user@example.com
```

---

## 🎨 Optional: Add Progress Updates

To send real-time progress updates during training, modify `cleanMobileTrainModel` in `/routes/mobileTrainModel.js`:

```javascript
// Inside cleanMobileTrainModel function, add progress emissions:

// After loading data:
socket.emit('training-progress', {
  percentage: 30,
  message: 'Processing YouTube data...',
  stage: 'training'
});

// After processing features:
socket.emit('training-progress', {
  percentage: 50,
  message: 'Training ML model...',
  stage: 'training'
});

// After training:
socket.emit('training-progress', {
  percentage: 80,
  message: 'Generating personality traits...',
  stage: 'inference'
});
```

---

## 🔐 Security Considerations

### JWT Token Verification

The current setup accepts any token. For production, add proper JWT verification:

```javascript
io.on('connection', async (socket) => {
  const token = socket.handshake.auth.token;
  
  try {
    // Verify JWT token
    const { verifyToken } = await import('./functions/authenticate.js');
    const decoded = await verifyToken(token);
    
    // Attach user info to socket
    socket.userId = decoded.sub;
    socket.userEmail = decoded.email;
    
    console.log('✅ Socket authenticated for:', socket.userEmail);
    
  } catch (error) {
    console.log('❌ Invalid token:', error.message);
    socket.emit('training-error', { message: 'Invalid authentication token' });
    socket.disconnect();
    return;
  }
  
  // ... rest of handlers
});
```

### CORS Restrictions

For production, restrict CORS to your domains:

```javascript
const io = new Server(server, {
  cors: {
    origin: [
      "https://yourdomain.com",
      "https://app.yourdomain.com"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

---

## 🚨 Common Issues

### Issue 1: "Cannot read property 'sockets' of undefined"

**Cause:** Socket.IO not initialized  
**Fix:** Make sure you uncommented the Socket.IO initialization in Step 1

### Issue 2: Socket connects but no events received

**Cause:** Event handlers not registered  
**Fix:** Make sure the `io.on('connection')` handler is added in Step 2

### Issue 3: "cleanMobileTrainModel is not a function"

**Cause:** Import path incorrect  
**Fix:** Check the relative path in the dynamic import:
```javascript
const { cleanMobileTrainModel } = await import('./routes/mobileTrainModel.js');
```

### Issue 4: Training starts but never completes

**Cause:** Missing completion event in `cleanMobileTrainModel`  
**Fix:** Add `socket.emit('training-complete', {...})` at the end of the training function

---

## ✅ Verification Checklist

- [ ] Socket.IO initialized in `app.js`
- [ ] CORS configured for Socket.IO
- [ ] `io` instance stored on app with `app.set('io', io)`
- [ ] `activeProcesses` tracker initialized
- [ ] `io.on('connection')` handler added
- [ ] `start-training` event handler implemented
- [ ] JWT token verification added (optional but recommended)
- [ ] Server exports updated to include `server`
- [ ] Server start script updated to use exported server
- [ ] Backend restarted
- [ ] Console logs show Socket.IO initialization
- [ ] Web SDK connects successfully
- [ ] Training completes and emits `training-complete` event

---

## 📊 Expected Flow

```
Web SDK                          Backend
  |                                |
  |------- Socket.IO Connect ----->|
  |<------ connect event ---------|
  |                                |
  |------- start-training -------->|
  |         (with token)           |
  |                                |- Verify JWT
  |                                |- Load user data
  |                                |- Start training
  |                                |
  |<----- training-progress -------|  (10%)
  |<----- training-progress -------|  (30%)
  |<----- training-progress -------|  (50%)
  |<----- training-progress -------|  (80%)
  |                                |
  |<----- training-complete -------|
  |         (with traits)          |
  |                                |
  |------- disconnect ------------>|
```

---

## 🎯 Result

After following these steps, your web SDK training should work exactly like the mobile app training, with real-time progress updates and personality traits returned!

The console will show:
```javascript
✅ Socket connected: ABC123
🚀 Emitting start-training event with: {...}
📊 Training progress: 30%
📊 Training progress: 50%
📊 Training progress: 80%
✅ Training complete via Socket.IO: {traits: {...}}

🎉 ===== TRAINING + INFERENCE COMPLETE =====
📊 Training Results: {...}
🧠 Traits Retrieved: {openness: 0.75, conscientiousness: 0.82, ...}
✅ Model ready for predictions!
```

🎉 Done!
