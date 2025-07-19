# Mobile Training Routes Summary & SDK Guidelines

## Issues Fixed

### 1. **Strict Data Validation** ✅
**Problem**: Users with 70 upvoted but 0 downvoted interactions were allowed to proceed with training, creating severely imbalanced models.

**Solution**: Enhanced `checkSufficientData()` function to:
- **STOP training** if user has 0 negative interactions (previously was just a warning)
- **STOP training** if user has 0 positive interactions  
- Require minimum 3+ positive AND 3+ negative interactions for training
- Provide clear error messages with specific guidance for each platform

**Impact**: Users will now get proper error messages telling them exactly what they need to do:
```json
{
  "error": "No negative interaction data found! You need to dislike/downvote content...",
  "code": "INSUFFICIENT_DATA",
  "details": {
    "upvotedCount": 70,
    "downvotedCount": 0,
    "missingNegativeData": true,
    "suggestions": [
      "❌ CRITICAL: You have no negative data - model cannot learn without both positive and negative examples",
      "👎 Dislike/downvote content on your connected platforms:",
      "• YouTube: Dislike videos you don't enjoy",
      "• Reddit: Downvote posts you disagree with"
    ]
  }
}
```

### 2. **Standardized Encryption + ARDrive Storage** ✅
**Problem**: Encryption and permanent storage were only available in a separate "advanced" route, but should be standard for ALL models.

**Solution**: Made encryption and ARDrive storage **standard for all training routes**:

#### **Route 1: `/mobile-training/clean` (Regular SDK Users)**
- **Purpose**: Standard mobile training for regular SDK users
- **Features**: 
  - ❌ NO inference testing
  - ✅ Model training only
  - ✅ **AES-256-CBC encryption with user PIN + server key**
  - ✅ **ARDrive (Arweave) permanent storage**
  - ✅ **S3 fallback if ARDrive fails**
  - ✅ **gzip compression**
  - ❌ No dual database storage
- **Use Case**: Regular mobile apps that need secure, permanent model storage

#### **Route 2: `/mobile-training/enoch` (Enoch SDK Users)**
- **Purpose**: Advanced training for Enoch SDK with inference and matching
- **Features**:
  - ✅ WITH inference testing (72 test categories)
  - ✅ Model training
  - ✅ **AES-256-CBC encryption with user PIN + server key**
  - ✅ **ARDrive (Arweave) permanent storage**
  - ✅ **S3 fallback if ARDrive fails**
  - ✅ **gzip compression**
  - ✅ Stores in both main & Enoch databases
  - ✅ Stores query scores for matching
- **Use Case**: Enoch SDK that needs inference results, matching, and secure storage

#### **~~Route 3: `/mobile-training/encrypted`~~ (REMOVED)**
- **Status**: ❌ **REMOVED** - Encryption is now standard for all routes
- **Migration**: Use `/mobile-training/clean` or `/mobile-training/enoch` instead

### 3. **ARDrive Error Fixed** ✅
**Problem**: `ReferenceError: arDrive is not defined` error preventing ARDrive uploads.

**Solution**: Uncommented ARDrive imports in `src/utils/arweaveUtils.js`:
```javascript
import Arweave from 'arweave';
import { ArDrive } from 'ardrive-core-js';
```

## SDK Implementation Guidelines

### **Regular Mobile SDK (iOS/Android)**
**Use Route**: `/mobile-training/clean`

**Request Example**:
```javascript
POST /mobile-training/clean
Headers: {
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
Body: {
  "socketId": "user_socket_id",
  "connectedPlatforms": {
    "platforms": [
      {
        "platform": "youtube",
        "accessToken": "token",
        "userData": {}
      }
    ]
  }
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "Clean mobile training started successfully",
  "username": "user_123",
  "features": {
    "inference": false,
    "storage": "ARDrive with S3 fallback",
    "compression": true,
    "encryption": true,
    "type": "clean-mobile-training"
  }
}
```

### **Enoch SDK**
**Use Route**: `/mobile-training/enoch`

**Request Example**: Same as above, but different endpoint

**Response Example**:
```json
{
  "success": true,
  "message": "Enoch mobile training started successfully",
  "username": "user_123",
  "features": {
    "inference": true,
    "storage": "ARDrive with S3 fallback",
    "compression": true,
    "encryption": true,
    "type": "enoch-mobile-training",
    "databases": ["main", "enoch"],
    "queryScores": true
  }
}
```

### **~~Advanced/Encrypted SDK~~ (REMOVED)**
**Status**: ❌ **REMOVED** - Encryption is now standard for all routes
**Migration**: Use `/mobile-training/clean` or `/mobile-training/enoch` based on your needs
**Requirements**: All routes now require user to have PIN set up for encryption

## Error Handling Updates

### **New Error Codes**

#### `INSUFFICIENT_DATA`
- **When**: User has 0 positive OR 0 negative interactions
- **Action**: Show specific guidance for each platform
- **UI**: Display platform-specific instructions

#### `CONNECTIONS_REQUIRED`
- **When**: User has no connected social media accounts
- **Action**: Redirect to connection setup
- **UI**: Show available platforms to connect

#### `LIMITED_DATA`
- **When**: User has some data but less than recommended amounts
- **Action**: Warn user but allow training to continue
- **UI**: Show warning with suggestions for better results

#### `PIN_REQUIRED` (NEW)
- **When**: User doesn't have PIN set up (required for encryption)
- **Action**: Redirect to PIN setup flow
- **UI**: Show PIN setup instructions and requirements

### **Socket Events**

All training routes emit these events:

```javascript
// Progress updates
socket.on('trainingUpdate', (data) => {
  if (data.error) {
    // Handle error (stop training, show message)
    console.error('Training error:', data.error);
  } else if (data.warning) {
    // Handle warning (show warning, continue training)
    console.warn('Training warning:', data.warning);
  } else {
    // Handle status update
    console.log('Training status:', data.status);
  }
});

// Training completed
socket.on('trainingCompleted', (data) => {
  console.log('Training completed:', data.status);
});

// Model ready
socket.on('modelStandby', (data) => {
  console.log('Model ready:', data.message);
  // data.inference = true/false (indicates if inference was run)
  // data.storage = "ARDrive with S3 fallback" (indicates storage approach)
  // data.encryption = true (all models are now encrypted)
});
```

## Migration Guide

### **For Existing SDKs**

1. **Identify your SDK type**:
   - Regular mobile app → Use `/mobile-training/clean`
   - Enoch SDK → Use `/mobile-training/enoch`
   - ~~Advanced/encrypted~~ → **REMOVED** (encryption is now standard)

2. **Update your endpoints**:
   - Replace `/mobile-training/encrypted` → Use `/mobile-training/clean` or `/mobile-training/enoch`
   - Replace existing training endpoints with appropriate new route
   - Update error handling to support new error codes
   - **IMPORTANT**: All routes now require user PIN for encryption

3. **Test data validation**:
   - Ensure your app handles `INSUFFICIENT_DATA` errors properly
   - Test with users who have no negative data
   - Verify UI shows appropriate platform-specific guidance
   - **NEW**: Ensure your app handles encryption requirements (user PIN setup)

### **For New SDKs**

1. **Choose appropriate route** based on your needs
2. **Implement proper error handling** for all new error codes
3. **Test with various data scenarios**:
   - No connections
   - No negative data
   - No positive data
   - Limited data
   - Sufficient data

## Testing Checklist

- [ ] Test user with no connected accounts
- [ ] Test user with 0 negative interactions
- [ ] Test user with 0 positive interactions  
- [ ] Test user with limited data (< 10 interactions)
- [ ] Test user with sufficient data (> 10 interactions)
- [ ] **NEW**: Test user without PIN setup (should get `PIN_REQUIRED` error)
- [ ] **NEW**: Test user with PIN setup (encryption should work)
- [ ] **NEW**: Test ARDrive upload success and S3 fallback scenarios
- [ ] Test socket connection handling
- [ ] Test error message display
- [ ] Test training completion flow
- [ ] Verify correct route is being used for your SDK type
- [ ] **NEW**: Verify encryption metadata is stored in user database

## Summary

✅ **Fixed**: Strict data validation prevents training with insufficient data
✅ **Fixed**: Encryption and ARDrive storage now standard for ALL models
✅ **Fixed**: Separate routes for different SDK types (clean vs inference)
✅ **Fixed**: ARDrive error resolved
✅ **Added**: Clear error messages with platform-specific guidance
✅ **Added**: Two distinct training routes (removed separate encryption route)
✅ **Added**: Comprehensive error handling and user guidance
✅ **STANDARDIZED**: AES-256-CBC encryption + ARDrive storage for all models

**SDK teams should**:
1. Choose the appropriate route for their SDK type (`/clean` or `/enoch`)
2. **IMPORTANT**: Ensure users have PIN setup for encryption (now required for all routes)
3. Update error handling to support new error codes  
4. Test with various data scenarios to ensure proper user guidance
5. Verify training flows work correctly with the new validation rules
6. Update any existing `/encrypted` endpoints to use `/clean` or `/enoch` 