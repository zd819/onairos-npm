import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import { User } from '../../Mongoose/models.js';
import { getEnochModels } from '../../utils/enochDb.js';
import { google } from 'googleapis';
import { refreshTokenForYoutube, getUserYouTubeDetails } from '../../routes/YoutubePullUserData.js';
import { isTokenExpired } from '../../routes/YoutubePullUserData.js';
import { authenticateApiKey, requirePermission } from '../middleware/unifiedApiKeyAuth.js';
import { youtubeAuthMiddleware, basicYoutubeAuth, testYoutubeAuth } from '../middleware/youtubeAuth.js';

dotenv.config();

const youtube = google.youtube('v3');
const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
);

// OAuth configuration validation on startup
if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET) {
  console.error('❌ Missing YouTube OAuth credentials - refresh token exchange will fail');
}

const router = express.Router();
router.use(bodyParser.text());

// ===== TEST ENDPOINTS =====

// Test endpoint to verify API key setup
router.post('/test-auth', testYoutubeAuth, async (req, res) => {
  try {
    console.log('✅ [YOUTUBE-TEST] API key authentication successful!');
    console.log('👤 User:', req.user.userName || req.user.email);
    console.log('🔑 API Key:', req.apiKey.name || 'Unnamed');
    console.log('🎯 Permissions:', req.apiKey.permissions);
    console.log('📊 Rate Limits:', req.rateLimits);
    
    res.json({
      success: true,
      message: 'YouTube API key authentication successful',
      user: {
        userName: req.user.userName,
        email: req.user.email,
        devAccount: req.user.devAccount
      },
      apiKey: {
        name: req.apiKey.name,
        permissions: req.apiKey.permissions,
        lastUsed: req.apiKey.lastUsed,
        usageCount: req.apiKey.usageCount
      },
      rateLimits: req.rateLimits
    });
  } catch (error) {
    console.error('❌ [YOUTUBE-TEST] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== OAUTH ENDPOINTS =====

// Redirect user to YouTube's authorization URL (User-initiated OAuth - no API key required)
router.post('/authorize', (req, res) => {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI;
    const scope = [
        'https://www.googleapis.com/auth/youtube.readonly'
    ];

    const stateObject = {
        connectionType: 'youtube',
        timestamp: Date.now(),
        username: req.body.session.username,
    };
    const state = Buffer.from(JSON.stringify(stateObject)).toString('base64');

    const authorizationUrl = oauth2Client.generateAuthUrl({
        redirect_uri: 'https://api2.onairos.uk/youtube/callback',
        access_type: 'offline',
        scope: scope,
        state: state,
        prompt: 'consent',
        include_granted_scopes: true
    });
    
    res.json({ youtubeURL: authorizationUrl });
});

// OAuth callback handler
router.get('/callback', async (req, res) => {
    try {
        const { code, state: stateParam } = req.query;
        const stateObject = JSON.parse(Buffer.from(stateParam, 'base64').toString('utf8'));
        
        const { tokens } = await oauth2Client.getToken(code).catch(err => {
            console.error("Error getting tokens: ", err);
            res.status(500).send('Error retrieving tokens');
            return;
        });

        if (!tokens) {
            res.status(500).send('No tokens received');
            return;
        }
        
        console.log("OAuth2 Tokens: ", tokens, " for code: ", code);
        const { access_token, refresh_token, expiry_date } = tokens;

        try {
            const youtubeResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                },
            });

            const youtubeData = await youtubeResponse.json();
            console.log("YouTube Data: ", youtubeData);
            const youtubeChannelTitle = youtubeData.items?.[0]?.snippet?.title || "No Channel Title";

            await updateUserWithYoutubeConnection(stateObject.username, youtubeChannelTitle, access_token, refresh_token, expiry_date);
            
            // Redirect back to Onairos home page
            res.redirect("https://onairos.uk/Home");

        } catch (error) {
            console.error(error);
            res.status(500).send('Failed to retrieve YouTube data');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error in Callback: ' + error.message);
    }
});

// ===== MOBILE AUTHENTICATION ENDPOINTS =====

// Mobile OAuth signin
router.post('/mobileSignin', basicYoutubeAuth, async (req, res) => {
  try {
    const { idToken, accessToken, serverAuthCode, username } = req.body;
    
    // Verify Google token
    const payload = await verifyGoogleToken(idToken);
    
    // Exchange the serverAuthCode for tokens
    const { tokens } = await oauth2Client.getToken(serverAuthCode);

    if (!tokens) {
        return res.status(500).send('No tokens received');
    }
    
    console.log("OAuth2 Tokens: ", tokens);
    const { access_token, refresh_token, expiry_date } = tokens;

    try {
        const youtubeResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
            headers: {
                'Authorization': `Bearer ${access_token}`,
            },
        });
        
        const youtubeData = await youtubeResponse.json();
        console.log("YouTube Data: ", youtubeData);
        const youtubeChannelTitle = youtubeData.items?.[0]?.snippet?.title || "No Channel Title";

        const userIdentifier = username || payload.email;
        await updateUserWithYoutubeConnection(userIdentifier, youtubeChannelTitle, access_token, refresh_token, expiry_date);
        
        res.status(200).json({ valid: true });

    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve YouTube data');
    }
  } catch (error) {
    console.error('Error in mobileSignin:', error);
    res.status(500).send('Server error');
  }
});

// Enhanced native mobile app YouTube authentication
router.post('/native-auth', youtubeAuthMiddleware, async (req, res) => {
  try {
    console.log('✅ [YOUTUBE-AUTH] Middleware passed successfully');
    const { 
      session, 
      googleUser, 
      accessToken, 
      refreshToken, 
      idToken, 
      userAccountInfo,
      oauthClientType,
      clientId: explicitClientId
    } = req.body;
    
    // Extract the YouTube channel information
    const { 
      username, 
      email, 
      authToken, 
      channelName,  
      channelId     
    } = userAccountInfo || {};
    
    console.log('📺 Received YouTube auth data:', {
      username,
      email,
      channelName: channelName || session?.channelName,
      channelId: channelId || session?.channelId,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      tokenLength: accessToken ? accessToken.length : 0,
      accessTokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'None',
      refreshTokenPreview: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'None',
      refreshTokenLength: refreshToken ? refreshToken.length : 0,
      idTokenPresent: !!idToken,
      sessionData: session ? Object.keys(session) : 'None',
      googleUserData: googleUser ? Object.keys(googleUser) : 'None'
    });
    
    if (!accessToken) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing access token',
        details: 'accessToken is required for YouTube API access',
        code: 'MISSING_ACCESS_TOKEN',
        needsReauth: true,
        reAuthTrigger: {
          showPopup: true,
          forceConsent: true,
          reason: 'No access token provided',
          method: 'forceYouTubeReconnectionWithConsent'
        }
      });
    }

    // Test the access token by making a YouTube API call
    console.log('🔍 Testing YouTube API access with provided token...');
    let tokenValidationResult = {
      valid: false,
      error: null,
      channelData: null
    };
    
    try {
      const testResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error('❌ YouTube API test failed:', testResponse.status, errorText);
        
        tokenValidationResult.error = errorText;
        
        let errorMessage = 'YouTube API access denied';
        let suggestions = [];
        let needsReauth = true;
        
        if (testResponse.status === 403) {
          errorMessage = 'YouTube API access forbidden - insufficient permissions';
          suggestions = [
            'The access token may not have YouTube API permissions',
            'Try using YouTube Data API Client instead of Google Sign-In',
            'Ensure YouTube scopes are requested: https://www.googleapis.com/auth/youtube.readonly'
          ];
        } else if (testResponse.status === 401) {
          errorMessage = 'YouTube API access unauthorized - invalid token';
          suggestions = [
            'The access token may be expired or invalid',
            'Try refreshing the token or re-authenticating'
          ];
        }
        
        return res.status(400).json({ 
          success: false,
          error: errorMessage,
          details: errorText,
          code: 'YOUTUBE_API_ACCESS_DENIED',
          suggestions,
          apiStatus: testResponse.status,
          needsReauth: needsReauth,
          reAuthTrigger: {
            showPopup: true,
            forceConsent: true,
            reason: errorMessage,
            method: 'forceYouTubeReconnectionWithConsent'
          }
        });
      }

      const testData = await testResponse.json();
      tokenValidationResult.valid = true;
      tokenValidationResult.channelData = testData;
      
      console.log('✅ YouTube API test successful:', {
        channelsFound: testData.items ? testData.items.length : 0,
        quotaUsed: testData.pageInfo ? 'Yes' : 'No'
      });
      
      // Use API response for channel info if not provided
      if (testData.items && testData.items.length > 0 && !channelName) {
        const apiChannelData = testData.items[0];
        if (userAccountInfo) {
          userAccountInfo.channelName = apiChannelData.snippet.title;
          userAccountInfo.channelId = apiChannelData.id;
        }
        console.log('📺 Retrieved channel info from API:', {
          name: apiChannelData.snippet.title,
          id: apiChannelData.id
        });
      }
      
    } catch (apiError) {
      console.error('❌ YouTube API test error:', apiError);
      tokenValidationResult.error = apiError.message;
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to validate YouTube API access',
        details: apiError.message,
        code: 'YOUTUBE_API_TEST_FAILED',
        needsReauth: true,
        reAuthTrigger: {
          showPopup: true,
          forceConsent: true,
          reason: 'API validation failed',
          method: 'forceYouTubeReconnectionWithConsent'
        }
      });
    }

    // Enhanced refresh token extraction
    let finalAccessToken = accessToken;
    let finalRefreshToken = null;
    let finalTokenExpiry = new Date(Date.now() + 3600000);
    let serverAuthCodeError = null;
    
    console.log('🔍 [REFRESH-TOKEN-DEBUG] ===== REFRESH TOKEN EXTRACTION =====');
    
    // Try to extract refresh token from multiple possible sources
    const refreshTokenSources = [
      { name: 'refreshToken', value: refreshToken },
      { name: 'req.body.serverAuthCode', value: req.body.serverAuthCode },
      { name: 'req.body.refresh_token', value: req.body.refresh_token },
      { name: 'req.body.server_auth_code', value: req.body.server_auth_code },
      { name: 'req.body.authCode', value: req.body.authCode },
      { name: 'userAccountInfo.refreshToken', value: userAccountInfo?.refreshToken },
      { name: 'userAccountInfo.serverAuthCode', value: userAccountInfo?.serverAuthCode },
      { name: 'session.refreshToken', value: session?.refreshToken },
      { name: 'session.serverAuthCode', value: session?.serverAuthCode }
    ];
    
    console.log('🔍 [REFRESH-TOKEN-DEBUG] Checking all possible sources:');
    refreshTokenSources.forEach(source => {
      if (source.value && typeof source.value === 'string' && source.value.trim().length > 0) {
        console.log(`✅ [REFRESH-TOKEN-DEBUG] ${source.name}: ${source.value.substring(0, 20)}... (length: ${source.value.length})`);
      } else {
        console.log(`❌ [REFRESH-TOKEN-DEBUG] ${source.name}: ${source.value || 'Missing/Null'}`);
      }
    });
    
    // Find the first non-null refresh token
    let extractionSource = null;
    for (const source of refreshTokenSources) {
      if (source.value && typeof source.value === 'string' && source.value.trim().length > 0) {
        finalRefreshToken = source.value.trim();
        extractionSource = source.name;
        console.log(`✅ [REFRESH-TOKEN-DEBUG] EXTRACTED from ${source.name}: ${finalRefreshToken.substring(0, 20)}...`);
        break;
      }
    }
    
    if (!finalRefreshToken) {
      console.error(`❌ [REFRESH-TOKEN-DEBUG] CRITICAL: No refresh token found in any expected field!`);
      console.error(`❌ [REFRESH-TOKEN-DEBUG] This will result in refreshToken: null being stored`);
      console.error(`❌ [REFRESH-TOKEN-DEBUG] Frontend may be sending refresh token in unexpected field name`);
    } else {
      console.log(`✅ [REFRESH-TOKEN-DEBUG] Successfully extracted refresh token from: ${extractionSource}`);
      console.log(`✅ [REFRESH-TOKEN-DEBUG] Token preview: ${finalRefreshToken.substring(0, 20)}... (length: ${finalRefreshToken.length})`);
    }

    // Check if the "refreshToken" is actually a serverAuthCode and exchange it
    if (finalRefreshToken && (finalRefreshToken.startsWith('4/') || finalRefreshToken.length < 100)) {
      console.log('[DEBUG] Detected serverAuthCode, exchanging for real tokens...');
      try {
        const selectedClientId = process.env.YOUTUBE_CLIENT_ID;
        const selectedClientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        const selectedRedirectUri = process.env.YOUTUBE_REDIRECT_URI || 'https://api2.onairos.uk/youtube/callback';
        
        const exchangeOAuth2Client = new google.auth.OAuth2(
          selectedClientId,
          selectedClientSecret,
          selectedRedirectUri
        );
        
        const { tokens } = await exchangeOAuth2Client.getToken(finalRefreshToken);
        finalAccessToken = tokens.access_token || finalAccessToken;
        finalRefreshToken = tokens.refresh_token || null;
        if (tokens.expiry_date) {
          finalTokenExpiry = new Date(tokens.expiry_date);
        } else {
          finalTokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000));
        }
        
        console.log('[DEBUG] Successfully exchanged serverAuthCode for real tokens');
        console.log('[DEBUG] - Got access token:', !!tokens.access_token);
        console.log('[DEBUG] - Got refresh token:', !!tokens.refresh_token);
        console.log('[DEBUG] - Token expiry:', finalTokenExpiry);
        
        if (!tokens.refresh_token) {
          console.warn('[DEBUG] ⚠️  WARNING: ServerAuthCode exchange succeeded but no refresh token received');
          serverAuthCodeError = 'OAuth configuration issue - no refresh token obtained';
        }
      } catch (exchangeError) {
        console.error('[DEBUG] ServerAuthCode exchange failed:', exchangeError.message);
        serverAuthCodeError = exchangeError.message;
        
        if (exchangeError.message.includes('unauthorized_client')) {
          serverAuthCodeError = 'OAuth client configuration error - check Google Console settings';
        } else if (exchangeError.message.includes('invalid_grant')) {
          serverAuthCodeError = 'ServerAuthCode expired or already used';
        }
        
        console.error('[DEBUG] Continuing with original access token (without refresh capability)');
        finalRefreshToken = null;
      }
    }

    // User lookup logic - dual authentication pattern
    let user = null;
    let userType = 'onairos';
    let userId = null;
    let isEnochUser = false;
    
    console.log('🔍 [USER-LOOKUP] Dual auth user lookup:', {
      hasUserContext: req.hasUserContext,
      userContextId: req.userContext?.id,
      userContextEmail: req.userContext?.email,
      userContextType: req.userContext?.tokenType,
      fallbackUsername: username,
      fallbackEmail: email,
      sessionUsername: session?.username,
      authToken: authToken ? 'present' : 'missing'
    });
    
    // Priority 1: Use verified user context from JWT token
    if (req.hasUserContext && req.userContext) {
      userId = req.userContext.id;
      isEnochUser = req.userContext.isEnochUser;
      
      console.log('🔑 Using verified user context:', {
        userId,
        email: req.userContext.email,
        tokenType: req.userContext.tokenType,
        isEnochUser
      });
    }
    
    // Priority 2: Fallback to authToken in body (for backward compatibility)
    else if (authToken) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(authToken, process.env.ONAIROS_JWT_SECRET_KEY);
        userId = decoded.userId || decoded.id || decoded.sub;
        
        // Check if this is an Enoch token by looking at the structure
        if (decoded.id && !decoded.userId) {
          isEnochUser = true;
        }
        
        console.log('🔑 Using authToken from body:', {
          userId,
          isEnochUser,
          tokenType: isEnochUser ? 'Enoch' : 'Onairos'
        });
      } catch (jwtError) {
        console.warn('JWT verification failed:', jwtError.message);
      }
    }

    // Verify the ID token if provided
    let payload = null;
    if (idToken) {
      try {
        payload = await verifyGoogleToken(idToken);
        console.log('Google token verified for user:', payload.email);
      } catch (tokenError) {
        console.error('Token verification failed:', tokenError);
        return res.status(401).json({ 
          success: false,
          error: 'Invalid Google token',
          details: tokenError.message,
          needsReauth: true,
          reAuthTrigger: {
            showPopup: true,
            forceConsent: true,
            reason: 'Invalid Google ID token',
            method: 'forceYouTubeReconnectionWithConsent'
          }
        });
      }
    }

    // Find user by multiple methods, checking both Enoch and Onairos databases
    if (isEnochUser && userId) {
      try {
        const { EnochUser } = getEnochModels();
        user = await EnochUser.findById(userId);
        if (user) {
          userType = 'enoch';
          console.log('👤 Found Enoch user:', user.email || user.name);
        }
      } catch (enochError) {
        console.warn('Error querying Enoch database:', enochError.message);
      }
    }
    
    // If not found in Enoch or not an Enoch user, try Onairos database
    if (!user) {
      if (userId) {
        user = await User.findById(userId);
      }
      if (!user && username) {
        user = await User.findOne({ userName: username });
      }
      if (!user && email) {
        user = await User.findOne({ email: email });
      }
      if (!user && session?.username) {
        user = await User.findOne({ userName: session.username });
      }
      if (!user && req.userContext?.email) {
        user = await User.findOne({ email: req.userContext.email });
      }
      if (!user && req.userContext?.username) {
        user = await User.findOne({ userName: req.userContext.username });
      }
      
      if (user) {
        userType = 'onairos';
        console.log('👤 Found Onairos user:', user.userName || user.email);
      }
    }
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found for YouTube connection',
        details: req.hasUserContext ? 
          'User context was provided but user not found in database' : 
          'No user context provided - include user JWT token for user-specific connections',
        code: 'USER_NOT_FOUND',
        authentication: {
          apiKeyValid: true,
          userContextAvailable: req.hasUserContext,
          developerAccount: req.user.userName || req.user.email
        },
        suggestions: req.hasUserContext ? [
          'Verify the user JWT token is valid',
          'Check if user exists in database',
          'Ensure user account is properly set up'
        ] : [
          'Include user JWT token in Authorization header',
          'Or provide authToken in request body',
          'User context is needed for YouTube connections'
        ],
        needsReauth: false
      });
    }
    
    console.log('✅ User lookup successful:', {
      userType,
      userId: user._id,
      identifier: user.email || user.userName || user.name
    });

    // Store YouTube data with correct field names
    const youtubeData = {
      accessToken: finalAccessToken,
      refreshToken: finalRefreshToken,
      tokenExpiry: finalTokenExpiry,
      channelName: userAccountInfo?.channelName || channelName || session?.channelName || googleUser?.name || 'Unknown Channel',
      channelId: userAccountInfo?.channelId || channelId || session?.channelId || null,
      email: googleUser?.email || email,
      connectedAt: new Date(),
      lastValidated: new Date(),
      tokenValidationResult: tokenValidationResult
    };
    
    console.log('🔍 [STORAGE-DEBUG] ===== YOUTUBE DATA STORAGE ANALYSIS =====');
    console.log('🔍 [STORAGE-DEBUG] Data being stored:');
    console.log('🔍 [STORAGE-DEBUG] - accessToken:', finalAccessToken ? `${finalAccessToken.substring(0, 20)}...` : 'null');
    console.log('🔍 [STORAGE-DEBUG] - refreshToken:', finalRefreshToken ? `${finalRefreshToken.substring(0, 20)}...` : 'null');
    console.log('🔍 [STORAGE-DEBUG] - tokenExpiry:', finalTokenExpiry);
    console.log('🔍 [STORAGE-DEBUG] - channelName:', youtubeData.channelName);
    console.log('🔍 [STORAGE-DEBUG] - User type:', userType);
    console.log('🔍 [STORAGE-DEBUG] - User ID:', user._id);
    
    if (!finalRefreshToken) {
      console.error('🔍 [STORAGE-DEBUG] ❌ CRITICAL: About to store NULL refresh token!');
      console.error('🔍 [STORAGE-DEBUG] This will cause token expiry issues later');
    } else {
      console.log('🔍 [STORAGE-DEBUG] ✅ About to store valid refresh token');
    }
    
    // Enhanced storage strategy for both databases
    let onairosUser = null;
    
    if (userType === 'enoch') {
      // For Enoch users, DUAL STORAGE STRATEGY
      const userEmail = user.email || user.enochEmail;
      const userName = user.name;
      
      console.log('📺 ENOCH USER: Implementing dual storage strategy...');
      
      // STEP 1: Store in Enoch database
      try {
        const { getEnochModels } = await import('../../utils/enochDb.js');
        const { EnochUser } = getEnochModels();
        
        console.log('🔍 [ENOCH-STORAGE-DEBUG] ===== ENOCH DB STORAGE =====');
        console.log('🔍 [ENOCH-STORAGE-DEBUG] Storing for user ID:', user._id);
        console.log('🔍 [ENOCH-STORAGE-DEBUG] youtubeAccessToken:', finalAccessToken ? 'Present' : 'null');
        console.log('🔍 [ENOCH-STORAGE-DEBUG] youtubeRefreshToken:', finalRefreshToken ? 'Present' : 'null');
        
        const enochUpdateResult = await EnochUser.updateOne(
          { _id: user._id },
          {
            $set: {
              youtubeAccessToken: finalAccessToken,
              youtubeRefreshToken: finalRefreshToken,
              youtubeTokenExpiry: finalTokenExpiry,
              youtubeChannelName: youtubeData.channelName,
              youtubeChannelId: youtubeData.channelId,
              youtubeConnectedAt: new Date(),
              youtubeLastValidated: new Date(),
              updatedAt: new Date()
            }
          }
        );
        
        console.log('🔍 [ENOCH-STORAGE-DEBUG] Update result:', enochUpdateResult);
        console.log('✅ Stored YouTube data in Enoch database for user:', userEmail);
        
        // Verify stored data
        const verifyEnochUser = await EnochUser.findById(user._id).select('youtubeRefreshToken youtubeAccessToken');
        console.log('🔍 [ENOCH-STORAGE-DEBUG] VERIFICATION - Stored refresh token:', verifyEnochUser?.youtubeRefreshToken ? 'Present' : 'null/missing');
        
      } catch (enochStoreError) {
        console.error('❌ Failed to store in Enoch database:', enochStoreError.message);
      }
      
      // STEP 2: Store in Onairos database (training compatibility)
      onairosUser = await User.findOne({ 
        $or: [
          { email: userEmail },
          { userName: userEmail },
          { userName: userName },
          { _id: user._id }
        ]
      });
      
      if (!onairosUser) {
        console.log('🔍 No existing Onairos account found for Enoch user, creating one...');
        onairosUser = new User({
          _id: user._id,
          email: userEmail,
          userName: userName || userEmail,
          accounts: {},
          connections: {}
        });
      }
      
      console.log('📺 Storing YouTube data in Onairos database for Enoch user:', userEmail);
    } else {
      // For regular Onairos users
      onairosUser = user;
      console.log('📺 Storing YouTube data in Onairos database for regular user:', user.userName || user.email);
    }
    
    // Store in Onairos accounts structure
    if (!onairosUser.accounts) {
      onairosUser.accounts = {};
    }
    onairosUser.accounts.youtube = youtubeData;
    
    // Update connections field
    if (!onairosUser.connections) {
      onairosUser.connections = {};
    }
    if (!onairosUser.connections.YouTube) {
      onairosUser.connections.YouTube = '-';
    }
    
    console.log('🔍 [ONAIROS-STORAGE-DEBUG] ===== ONAIROS DB STORAGE =====');
    console.log('🔍 [ONAIROS-STORAGE-DEBUG] User ID:', onairosUser._id);
    console.log('🔍 [ONAIROS-STORAGE-DEBUG] accounts.youtube.accessToken:', onairosUser.accounts.youtube.accessToken ? 'Present' : 'null');
    console.log('🔍 [ONAIROS-STORAGE-DEBUG] accounts.youtube.refreshToken:', onairosUser.accounts.youtube.refreshToken ? 'Present' : 'null');
    
    const onairosStoreResult = await onairosUser.save();
    console.log('🔍 [ONAIROS-STORAGE-DEBUG] Save result ID:', onairosStoreResult._id);
    
    // Verify stored data
    const verifyOnairosUser = await User.findById(onairosUser._id).select('accounts.youtube.refreshToken accounts.youtube.accessToken');
    console.log('🔍 [ONAIROS-STORAGE-DEBUG] VERIFICATION - Stored refresh token:', verifyOnairosUser?.accounts?.youtube?.refreshToken ? 'Present' : 'null/missing');
    
    console.log('✅ YouTube data stored successfully for user:', username || user.userName || user.email);
    
    // Test likes/dislikes access
    console.log('🔍 Testing YouTube likes/dislikes API access...');
    let likesTestResult = { success: false, error: null };
    let dislikesTestResult = { success: false, error: null };
    
    try {
      // Test likes access
      const likesResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=1&key=${process.env.YOUTUBE_API_KEY}`, {
        headers: { 'Authorization': `Bearer ${finalAccessToken}` }
      });
      
      if (likesResponse.ok) {
        const likesData = await likesResponse.json();
        likesTestResult.success = true;
        likesTestResult.count = likesData.items ? likesData.items.length : 0;
        console.log('✅ Likes API access successful');
      } else {
        const errorText = await likesResponse.text();
        likesTestResult.error = `Status ${likesResponse.status}: ${errorText}`;
        console.log('❌ Likes API access failed:', likesTestResult.error);
      }
      
      // Test dislikes access
      const dislikesResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=dislike&maxResults=1&key=${process.env.YOUTUBE_API_KEY}`, {
        headers: { 'Authorization': `Bearer ${finalAccessToken}` }
      });
      
      if (dislikesResponse.ok) {
        const dislikesData = await dislikesResponse.json();
        dislikesTestResult.success = true;
        dislikesTestResult.count = dislikesData.items ? dislikesData.items.length : 0;
        console.log('✅ Dislikes API access successful');
      } else {
        const errorText = await dislikesResponse.text();
        dislikesTestResult.error = `Status ${dislikesResponse.status}: ${errorText}`;
        console.log('❌ Dislikes API access failed:', dislikesTestResult.error);
      }
      
    } catch (testError) {
      console.error('❌ Likes/Dislikes API test error:', testError);
      likesTestResult.error = testError.message;
      dislikesTestResult.error = testError.message;
    }
    
    // Comprehensive response
    const response = {
      success: true,
      message: 'YouTube connection established successfully',
      hasRefreshToken: !!finalRefreshToken,
      refreshTokenReceived: !!finalRefreshToken,
      channelName: youtubeData.channelName,
      channelId: youtubeData.channelId,
      
      // YouTube details in expected format
      youtubeDetails: {
        channelName: youtubeData.channelName,
        channelId: youtubeData.channelId,
        email: googleUser?.email || email,
        accessToken: finalAccessToken,
        refreshToken: finalRefreshToken,
        tokenExpiry: finalTokenExpiry.toISOString(),
        connectedAt: youtubeData.connectedAt.toISOString()
      },
      
      // Authentication details
      authMethod: req.authMethod,
      userType: userType,
      authentication: {
        apiKeyValid: true,
        userContextAvailable: req.hasUserContext,
        developerAccount: req.user.userName || req.user.email,
        userAccount: req.userContext ? (req.userContext.email || req.userContext.username) : 'None',
        authPattern: 'API Key + User JWT (Dual Auth)'
      },
      
      // Token exchange and storage details
      tokenDetails: {
        serverAuthCodeExchange: serverAuthCodeError ? 'Failed' : 'Success',
        serverAuthCodeError: serverAuthCodeError,
        hasRefreshToken: !!finalRefreshToken,
        refreshTokenSource: finalRefreshToken ? 
          (serverAuthCodeError ? 'Direct (ServerAuthCode exchange failed)' : 'OAuth Exchange') : 
          'None',
        tokenExpiry: finalTokenExpiry,
        storageStrategy: userType === 'enoch' ? 'Dual (Enoch + Onairos)' : 'Single (Onairos)',
        storedInEnochDB: userType === 'enoch',
        storedInOnairosDB: true,
        tokenValidation: tokenValidationResult
      },
      
      // API access results
      apiAccess: {
        likes: likesTestResult,
        dislikes: dislikesTestResult
      },
      
      // Connection health assessment
      connectionHealth: {
        overall: finalRefreshToken ? 'Healthy' : 'Needs attention',
        refreshCapable: !!finalRefreshToken,
        trainingReady: true,
        validationEndpointCompatible: true,
        tokenValid: tokenValidationResult.valid,
        lastValidated: new Date().toISOString()
      },
      
      // Recommendations
      recommendations: {
        likesAccess: likesTestResult.success ? 'Available' : 'Limited - may need proper YouTube OAuth flow',
        dislikesAccess: dislikesTestResult.success ? 'Available' : 'Limited - may need proper YouTube OAuth flow',
        tokenType: finalRefreshToken ? 'Full OAuth (with refresh)' : 'Limited OAuth (no refresh)',
        authUsed: 'Developer API Key + User JWT Token',
        serverAuthCodeStatus: serverAuthCodeError ? 'Failed - Check OAuth configuration' : 'Success',
        refreshTokenStatus: finalRefreshToken ? 'Present and stored' : 'MISSING - Connection will expire!',
        
        actionRequired: finalRefreshToken ? [] : [
          '🚨 CRITICAL: No refresh token provided - connection will expire!',
          'Frontend must send refresh token in one of these fields:',
          '  - refreshToken (primary)',
          '  - serverAuthCode (alternative)', 
          '  - userAccountInfo.refreshToken',
          'Ensure frontend uses offlineAccess: true and forceCodeForRefreshToken: true',
          'User will need to reconnect when access token expires'
        ],
        
        benefits: [
          'Rate limiting per developer account',
          'User context for personalized connections',
          'Cross-database storage for Enoch users',
          'Enhanced validation and lookup capabilities',
          'Comprehensive connection health monitoring'
        ],
        
        frontendFixes: serverAuthCodeError ? [
          'Check Google Console OAuth client configuration',
          'Verify YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in backend',
          'Ensure redirect URI matches Google Console settings',
          'Use proper scope: https://www.googleapis.com/auth/youtube.readonly',
          'Add offlineAccess: true and forceCodeForRefreshToken: true in OAuth config'
        ] : []
      },
      
      // Frontend guidance
      needsReauth: false,
      frontendAction: 'PROCEED_NORMALLY',
      
      // Critical warning
      refreshTokenWarning: finalRefreshToken ? null : {
        severity: 'HIGH',
        message: 'No refresh token provided - connection will expire!',
        impact: 'User will need to reconnect when access token expires (typically 1 hour)',
        solution: 'Update frontend to send refresh token in request payload'
      }
    };
    
    // Log critical refresh token status
    if (!finalRefreshToken) {
      console.error(`🚨 CRITICAL: YouTube connection saved WITHOUT refresh token for user ${username}`);
      console.error(`🚨 This connection will expire and require manual reconnection!`);
    } else {
      console.log(`✅ YouTube connection saved WITH refresh token for user ${username}`);
    }
    
    res.json(response);

  } catch (error) {
    console.error('❌ Error in YouTube native auth:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: 'INTERNAL_ERROR',
      needsReauth: true,
      reAuthTrigger: {
        showPopup: true,
        forceConsent: true,
        reason: 'Internal server error during authentication',
        method: 'forceYouTubeReconnectionWithConsent'
      }
    });
  }
});

// ===== TOKEN MANAGEMENT ENDPOINTS =====

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    const { username, userIdentifier } = req.body;
    
    if (!username && !userIdentifier) {
      return res.status(400).json({
        error: 'Missing required parameter',
        details: 'Either username or userIdentifier is required',
        code: 'MISSING_USER_IDENTIFIER'
      });
    }
    
    const identifier = username || userIdentifier;
    console.log(`[DEBUG] Refresh token request for user: ${identifier}`);
    
    const newAccessToken = await refreshTokenForYoutube(identifier);
    
    console.log(`[DEBUG] Successfully refreshed YouTube token for user: ${identifier}`);
    
    res.json({
      success: true,
      message: 'YouTube token refreshed successfully',
      accessToken: newAccessToken.substring(0, 20) + '...',
      refreshedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`[DEBUG] Token refresh failed:`, error.message);
    
    let errorCode = 'TOKEN_REFRESH_FAILED';
    let statusCode = 500;
    let suggestions = [];
    
    if (error.message.includes('User not found')) {
      errorCode = 'USER_NOT_FOUND';
      statusCode = 404;
      suggestions = ['Verify the username or userIdentifier is correct'];
    } else if (error.message.includes('No refresh token available')) {
      errorCode = 'NO_REFRESH_TOKEN';
      statusCode = 400;
      suggestions = [
        'User needs to reconnect YouTube account with proper OAuth flow',
        'Ensure frontend sends refresh token during authentication',
        'Check if YouTube connection was made with offline access'
      ];
    } else if (error.message.includes('refresh_token')) {
      errorCode = 'INVALID_REFRESH_TOKEN';
      statusCode = 401;
      suggestions = [
        'Refresh token may be expired or invalid',
        'User needs to re-authenticate with YouTube'
      ];
    }
    
    res.status(statusCode).json({
      success: false,
      error: error.message,
      code: errorCode,
      suggestions: suggestions,
      timestamp: new Date().toISOString()
    });
  }
});

// Revoke connection endpoint
router.post('/revoke', async (req, res) => {
    const OnairosUsername = req.body.Info.username;
    try {
        let targetAccount = await User.findOne({ userName: OnairosUsername });
        
        if (!targetAccount) {
            console.log(`User not found by userName, trying email: ${OnairosUsername}`);
            targetAccount = await User.findOne({ email: OnairosUsername });
        }
        
        if (!targetAccount) {
            return res.status(404).send({ error: 'User not found' });
        }
        
        if (!targetAccount.accounts?.youtube?.accessToken) {
            return res.status(400).send({ error: 'No YouTube connection found' });
        }
        
        let accessToken = targetAccount.accounts.youtube.accessToken;
        const revokeTokenEndpoint = `https://oauth2.googleapis.com/revoke?token=${accessToken}`;
        
        if (isTokenExpired(targetAccount.accounts.youtube.tokenExpiry)) {
            accessToken = await refreshTokenForYoutube(OnairosUsername);
        }
        
        await axios.post(revokeTokenEndpoint, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        // Remove YouTube connection from user's document
        await User.updateOne({ _id: targetAccount._id }, { $unset: { "accounts.youtube": "" } });
        await User.updateOne(
            { _id: targetAccount._id },
            { $set: { 'connections.YouTube': '-' } }
        );
        
        res.status(200).send({ message: 'Token revoked successfully' });
    } catch (error) {
        console.log("Error Revoking YouTube: ", error);
        res.status(500).send({ error: 'Failed to revoke token' });
    }
});

// ===== CONNECTION HEALTH ENDPOINTS =====

// Comprehensive connection health check endpoint
router.get('/connection-status/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log(`🔍 [CONNECTION-STATUS] Checking YouTube connection for: ${username}`);
    
    // Find user in both databases
    let user = null;
    let userType = 'onairos';
    let youtubeAccount = null;
    let isEnochUser = false;
    
    // Check Enoch database first
    try {
      const { connectEnochDB, getEnochModels } = await import('../../utils/enochDb.js');
      await connectEnochDB();
      const { EnochUser } = getEnochModels();
      
      user = await EnochUser.findOne({ 
        $or: [
          { name: username },
          { email: username }
        ]
      });
      
      if (user) {
        userType = 'enoch';
        isEnochUser = true;
        youtubeAccount = {
          accessToken: user.youtubeAccessToken,
          refreshToken: user.youtubeRefreshToken,
          tokenExpiry: user.youtubeTokenExpiry,
          channelName: user.youtubeChannelName,
          channelId: user.youtubeChannelId,
          connectedAt: user.youtubeConnectedAt
        };
        console.log(`✅ Found Enoch user: ${user.name || user.email}`);
      }
    } catch (enochError) {
      console.warn(`⚠️ Enoch database check failed:`, enochError.message);
    }
    
    // Check Onairos database if not found in Enoch
    if (!user) {
      user = await User.findOne({ 
        $or: [
          { userName: username },
          { email: username }
        ]
      });
      
      if (user) {
        userType = 'onairos';
        youtubeAccount = user.accounts?.youtube;
        console.log(`✅ Found Onairos user: ${user.userName || user.email}`);
      }
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        needsReauth: false,
        connectionStatus: 'user_not_found'
      });
    }
    
    // Check if YouTube is connected
    if (!youtubeAccount || !youtubeAccount.accessToken) {
      return res.json({
        success: true,
        connected: false,
        needsReauth: true,
        connectionStatus: 'not_connected',
        reason: 'No YouTube connection found',
        userType: userType,
        recommendations: [
          'User needs to connect YouTube account',
          'Use proper OAuth flow with offline access'
        ]
      });
    }
    
    // Check token expiry
    const now = new Date();
    const tokenExpiry = youtubeAccount.tokenExpiry ? new Date(youtubeAccount.tokenExpiry) : null;
    const isTokenExpired = tokenExpiry ? now > tokenExpiry : false;
    const hasRefreshToken = !!youtubeAccount.refreshToken;
    
    console.log(`📊 [CONNECTION-STATUS] Token analysis:`, {
      hasAccessToken: !!youtubeAccount.accessToken,
      hasRefreshToken: hasRefreshToken,
      tokenExpiry: tokenExpiry?.toISOString(),
      isTokenExpired: isTokenExpired,
      userType: userType
    });
    
    // Test the actual token by making a YouTube API call
    let tokenValid = false;
    let apiError = null;
    
    try {
      console.log(`🔍 Testing YouTube API access with stored token...`);
      const testResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: {
          'Authorization': `Bearer ${youtubeAccount.accessToken}`,
        },
      });
      
      if (testResponse.ok) {
        tokenValid = true;
        console.log(`✅ YouTube API test successful - token is valid`);
      } else {
        const errorText = await testResponse.text();
        apiError = `API test failed: ${testResponse.status} - ${errorText}`;
        console.log(`❌ YouTube API test failed: ${apiError}`);
      }
    } catch (testError) {
      apiError = `API test error: ${testError.message}`;
      console.log(`❌ YouTube API test error: ${apiError}`);
    }
    
    // Determine connection status and re-auth need
    let connectionStatus = 'unknown';
    let needsReauth = false;
    let reason = '';
    let recommendations = [];
    
    if (!tokenValid) {
      if (isTokenExpired && hasRefreshToken) {
        try {
          console.log(`🔄 Attempting to refresh expired token...`);
          const newAccessToken = await refreshTokenForYoutube(username);
          
          connectionStatus = 'healthy_refreshed';
          needsReauth = false;
          reason = 'Token was expired but successfully refreshed';
          recommendations = ['Token automatically refreshed - connection is healthy'];
          
          console.log(`✅ Token refresh successful`);
        } catch (refreshError) {
          console.log(`❌ Token refresh failed: ${refreshError.message}`);
          
          connectionStatus = 'refresh_failed';
          needsReauth = true;
          reason = `Token refresh failed: ${refreshError.message}`;
          recommendations = [
            'Refresh token is invalid or expired',
            'User needs to reconnect YouTube with proper OAuth flow',
            'Ensure frontend uses offlineAccess: true and forceCodeForRefreshToken: true'
          ];
        }
      } else if (isTokenExpired && !hasRefreshToken) {
        connectionStatus = 'expired_no_refresh';
        needsReauth = true;
        reason = 'Token is expired and no refresh token available';
        recommendations = [
          'User needs to reconnect YouTube account',
          'Previous connection was made without proper refresh token setup',
          'Use enhanced OAuth configuration for refresh tokens'
        ];
      } else if (!isTokenExpired && !tokenValid) {
        connectionStatus = 'invalid_token';
        needsReauth = true;
        reason = 'Token appears valid but API access failed';
        recommendations = [
          'Token may have been revoked by user',
          'API permissions may have changed',
          'User needs to reconnect YouTube account'
        ];
      } else {
        connectionStatus = 'token_invalid';
        needsReauth = true;
        reason = 'Token validation failed';
        recommendations = ['User needs to reconnect YouTube account'];
      }
    } else {
      connectionStatus = 'healthy';
      needsReauth = false;
      reason = 'Connection is healthy and token is valid';
      recommendations = ['Connection is working properly'];
    }
    
    const response = {
      success: true,
      connected: true,
      needsReauth: needsReauth,
      connectionStatus: connectionStatus,
      reason: reason,
      userType: userType,
      tokenDetails: {
        hasAccessToken: !!youtubeAccount.accessToken,
        hasRefreshToken: hasRefreshToken,
        tokenExpiry: tokenExpiry?.toISOString(),
        isTokenExpired: isTokenExpired,
        tokenValid: tokenValid,
        apiError: apiError
      },
      channelInfo: {
        channelName: youtubeAccount.channelName,
        channelId: youtubeAccount.channelId,
        connectedAt: youtubeAccount.connectedAt
      },
      recommendations: recommendations,
      
      // Frontend action guidance
      frontendAction: needsReauth ? 'TRIGGER_REAUTH' : 'PROCEED_NORMALLY',
      reAuthTrigger: needsReauth ? {
        showPopup: true,
        forceConsent: true,
        clearCache: true,
        reason: reason,
        method: 'forceYouTubeReconnectionWithConsent'
      } : null
    };
    
    console.log(`📋 [CONNECTION-STATUS] Final assessment:`, {
      connectionStatus,
      needsReauth,
      reason,
      tokenValid,
      hasRefreshToken
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error checking YouTube connection status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check connection status',
      details: error.message,
      code: 'CONNECTION_STATUS_ERROR',
      needsReauth: true,
      connectionStatus: 'error'
    });
  }
});

// Force reconnect endpoint
router.post('/force-reconnect/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log(`🔄 [FORCE-RECONNECT] Clearing YouTube connection for user: ${username}`);
    
    // Find user
    let user = await User.findOne({ userName: username });
    if (!user) {
      user = await User.findOne({ email: username });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    console.log(`👤 Found user: ${user.userName || user.email} (ID: ${user._id})`);
    
    // Clear YouTube connection data completely
    const updateResult = await User.updateOne(
      { _id: user._id },
      { 
        $unset: { 
          "accounts.youtube": "",
        },
        $set: {
          "connections.YouTube": "-"
        }
      }
    );
    
    console.log(`✅ Cleared YouTube connection data for ${username}:`, updateResult);
    
    res.json({
      success: true,
      message: `YouTube connection cleared for user ${username}. User needs to reconnect via mobile app.`,
      user: {
        username: user.userName || user.email,
        userId: user._id
      },
      cleared: {
        youtubeAccount: true,
        youtubeConnection: true
      },
      nextSteps: [
        'User should reconnect YouTube via mobile app',
        'New connection will use updated /native-auth endpoint',
        'Refresh token should be properly stored'
      ]
    });
    
  } catch (error) {
    console.error('❌ Error in force reconnect:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear YouTube connection',
      details: error.message,
      code: 'FORCE_RECONNECT_ERROR'
    });
  }
});

// ===== VALIDATION ENDPOINTS =====

// Validation endpoint for testing refresh token functionality
router.get('/validate-connection/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({
        error: 'Username is required',
        code: 'MISSING_USERNAME'
      });
    }
    
    console.log(`[DEBUG] Validating YouTube connection for user: ${username}`);
    
    let youtubeDetails = null;
    let migrationNeeded = false;
    let errorDetails = null;
    
    try {
      youtubeDetails = await getUserYouTubeDetails(username);
    } catch (error) {
      console.log(`[DEBUG] getUserYouTubeDetails failed: ${error.message}`);
      
      if (error.message.includes('refresh token') || error.message.includes('token refresh failed')) {
        migrationNeeded = true;
        errorDetails = error.message;
        
        try {
          const models = getEnochModels();
          const user = await models.EnochUser.findOne({ username: username }) || 
                      await User.findOne({ username: username });
          
          if (user && user.accounts?.youtube) {
            youtubeDetails = {
              accessToken: !!user.accounts.youtube.accessToken,
              refreshToken: user.accounts.youtube.refreshToken,
              tokenExpiry: user.accounts.youtube.tokenExpiry,
              channelName: user.accounts.youtube.channelName,
              channelId: user.accounts.youtube.channelId,
              isEnochUser: !!user.email
            };
          }
        } catch (dbError) {
          console.error('[DEBUG] Failed to get basic user data:', dbError.message);
        }
      } else {
        throw error;
      }
    }
    
    const validation = {
      username: username,
      hasConnection: !!youtubeDetails,
      hasAccessToken: !!youtubeDetails?.accessToken,
      hasRefreshToken: !!youtubeDetails?.refreshToken,
      tokenExpiry: youtubeDetails?.tokenExpiry,
      isTokenExpired: youtubeDetails?.tokenExpiry ? new Date() > new Date(youtubeDetails.tokenExpiry) : null,
      channelName: youtubeDetails?.channelName,
      channelId: youtubeDetails?.channelId,
      userType: youtubeDetails?.isEnochUser ? 'Enoch' : 'Onairos',
      canRefreshToken: !!youtubeDetails?.refreshToken,
      needsReconnection: migrationNeeded || !youtubeDetails?.refreshToken || (youtubeDetails?.tokenExpiry && new Date() > new Date(youtubeDetails.tokenExpiry) && !youtubeDetails?.refreshToken),
      migrationRequired: migrationNeeded,
      migrationReason: errorDetails
    };
    
    console.log('[DEBUG] YouTube connection validation result:', validation);
    
    res.json({
      success: true,
      validation: validation,
      recommendations: validation.needsReconnection ? [
        'User needs to reconnect YouTube with enhanced frontend configuration',
        'Use Enoch\'s reconnectYouTube() function to force fresh authentication',
        'Ensure frontend includes offlineAccess: true and forceCodeForRefreshToken: true'
      ] : [
        'YouTube connection is properly configured',
        'Refresh token is available for automatic token renewal',
        'Training should work without token expiry issues'
      ]
    });
    
  } catch (error) {
    console.error('[DEBUG] YouTube connection validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate YouTube connection',
      details: error.message,
      code: 'VALIDATION_ERROR'
    });
  }
});

// ===== MIGRATION ENDPOINTS =====

// Get users needing migration
router.get('/users-needing-migration', async (req, res) => {
  try {
    console.log('[DEBUG] Finding users needing YouTube migration...');
    
    // Find Onairos users with YouTube connections but no refresh tokens
    const onairosUsersNeedingMigration = await User.find({
      'accounts.youtube.accessToken': { $exists: true },
      $or: [
        { 'accounts.youtube.refreshToken': { $exists: false } },
        { 'accounts.youtube.refreshToken': null },
        { 'accounts.youtube.refreshToken': '' }
      ]
    }).select('userName email accounts.youtube.channelName accounts.youtube.connectedAt');
    
    // Find Enoch users with YouTube connections but no refresh tokens
    let enochUsersNeedingMigration = [];
    try {
      const { connectEnochDB, getEnochModels } = await import('../../utils/enochDb.js');
      await connectEnochDB();
      const { EnochUser } = getEnochModels();
      
      enochUsersNeedingMigration = await EnochUser.find({
        youtubeAccessToken: { $exists: true },
        $or: [
          { youtubeRefreshToken: { $exists: false } },
          { youtubeRefreshToken: null },
          { youtubeRefreshToken: '' }
        ]
      }).select('name email youtubeChannelName youtubeConnectedAt');
    } catch (enochError) {
      console.warn('[DEBUG] Could not check Enoch users:', enochError.message);
    }
    
    // Combine results
    const allUsersNeedingMigration = [
      ...onairosUsersNeedingMigration.map(user => ({
        username: user.userName,
        email: user.email,
        channelName: user.accounts?.youtube?.channelName || 'Unknown',
        connectedAt: user.accounts?.youtube?.connectedAt,
        userType: 'Onairos'
      })),
      ...enochUsersNeedingMigration.map(user => ({
        username: user.name,
        email: user.email,
        channelName: user.youtubeChannelName || 'Unknown',
        connectedAt: user.youtubeConnectedAt,
        userType: 'Enoch'
      }))
    ];
    
    console.log(`[DEBUG] Found ${allUsersNeedingMigration.length} users needing migration`);
    console.log(`[DEBUG] - Onairos users: ${onairosUsersNeedingMigration.length}`);
    console.log(`[DEBUG] - Enoch users: ${enochUsersNeedingMigration.length}`);
    
    res.json({
      success: true,
      count: allUsersNeedingMigration.length,
      breakdown: {
        onairos: onairosUsersNeedingMigration.length,
        enoch: enochUsersNeedingMigration.length
      },
      users: allUsersNeedingMigration,
      summary: `${allUsersNeedingMigration.length} users need YouTube migration to get refresh tokens`
    });
    
  } catch (error) {
    console.error('[DEBUG] Error getting migration list:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get migration list',
      details: error.message 
    });
  }
});

// Track migration attempts
router.post('/migration-status', async (req, res) => {
  try {
    const { username, success, error, timestamp } = req.body;
    
    if (!username || typeof success !== 'boolean') {
      return res.status(400).json({
        error: 'Username and success status are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    console.log(`[DEBUG] Migration attempt logged: ${username} - ${success ? 'SUCCESS' : 'FAILED'}`);
    
    if (!success && error) {
      console.error(`[DEBUG] Migration error for ${username}:`, error);
    }
    
    res.json({
      success: true,
      message: 'Migration status logged',
      data: {
        username,
        migrationSuccess: success,
        loggedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[DEBUG] Error logging migration status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log migration status',
      details: error.message
    });
  }
});

// YouTube Connection Upgrade Endpoint
router.post('/upgrade-connection/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log(`🔄 [YOUTUBE-UPGRADE] Starting upgrade for user: ${username}`);
    
    // Find user in both databases
    let user = null;
    let userType = 'onairos';
    
    // Check Enoch database first
    try {
      const { connectEnochDB, getEnochModels } = await import('../../utils/enochDb.js');
      await connectEnochDB();
      const { EnochUser } = getEnochModels();
      
      user = await EnochUser.findOne({ 
        $or: [
          { name: username },
          { email: username }
        ]
      });
      
      if (user) {
        userType = 'enoch';
        console.log(`✅ Found Enoch user: ${user.name || user.email}`);
      }
    } catch (enochError) {
      console.warn(`⚠️ Enoch database check failed:`, enochError.message);
    }
    
    // Check Onairos database if not found in Enoch
    if (!user) {
      user = await User.findOne({ 
        $or: [
          { userName: username },
          { email: username }
        ]
      });
      
      if (user) {
        userType = 'onairos';
        console.log(`✅ Found Onairos user: ${user.userName || user.email}`);
      }
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Check current YouTube connection status
    let currentConnection = null;
    if (userType === 'enoch') {
      currentConnection = {
        hasAccessToken: !!user.youtubeAccessToken,
        hasRefreshToken: !!user.youtubeRefreshToken,
        tokenExpiry: user.youtubeTokenExpiry,
        channelName: user.youtubeChannelName
      };
    } else {
      currentConnection = {
        hasAccessToken: !!user.accounts?.youtube?.accessToken,
        hasRefreshToken: !!user.accounts?.youtube?.refreshToken,
        tokenExpiry: user.accounts?.youtube?.tokenExpiry,
        channelName: user.accounts?.youtube?.channelName
      };
    }
    
    const needsUpgrade = !currentConnection.hasRefreshToken || 
                        (currentConnection.tokenExpiry && new Date() > new Date(currentConnection.tokenExpiry));
    
    console.log(`📊 [YOUTUBE-UPGRADE] Connection analysis:`, {
      userType,
      hasAccessToken: currentConnection.hasAccessToken,
      hasRefreshToken: currentConnection.hasRefreshToken,
      needsUpgrade,
      tokenExpiry: currentConnection.tokenExpiry
    });
    
    res.json({
      success: true,
      message: 'YouTube connection upgrade status',
      userType: userType,
      currentConnection: currentConnection,
      needsUpgrade: needsUpgrade,
      upgradeReason: needsUpgrade ? 
        (!currentConnection.hasRefreshToken ? 'Missing refresh token' : 'Token expired') : 
        'Connection is healthy',
      
      // Clear instructions for frontend
      upgradeInstructions: {
        step1: 'Sign out from Google completely',
        step2: 'Configure Google Sign-In with offlineAccess: true',
        step3: 'Show consent popup to user',
        step4: 'Extract serverAuthCode as refresh token',
        step5: 'Send to /youtube/native-auth endpoint'
      },
      
      // Required OAuth configuration
      requiredOAuthConfig: {
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        scopes: ['https://www.googleapis.com/auth/youtube.readonly', 'openid', 'profile', 'email'],
        prompt: 'consent'
      },
      
      // What the upgrade will fix
      benefits: [
        'Automatic token refresh when expired',
        'No more manual reconnection needed',
        'Uninterrupted training process',
        'Better user experience'
      ]
    });
    
  } catch (error) {
    console.error('❌ Error in YouTube upgrade check:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check upgrade status',
      details: error.message,
      code: 'UPGRADE_CHECK_ERROR'
    });
  }
});

// ===== HELPER FUNCTIONS =====

// Google token verification
async function verifyGoogleToken(idToken) {
  const ticket = await oauth2Client.verifyIdToken({
      idToken: idToken,
  });
  const payload = ticket.getPayload();
  return payload;
}

// Update user with YouTube connection
async function updateUserWithYoutubeConnection(OnairosUsername, youtubeChannelTitle, token, refresh_token, expiry_date_unix) {
    console.log(`[DEBUG] Starting updateUserWithYoutubeConnection with username: "${OnairosUsername}"`);
    const expiryDate = new Date(expiry_date_unix);
    
    // Try to find user by userName first, then by email
    console.log(`[DEBUG] Searching for user by userName: "${OnairosUsername}"`);
    let targetAccount = await User.findOne({ userName: OnairosUsername });
    console.log(`[DEBUG] Found by userName:`, targetAccount ? `Yes (ID: ${targetAccount._id})` : 'No');
    
    if (!targetAccount) {
        console.log(`[DEBUG] User not found by userName, trying email: "${OnairosUsername}"`);
        targetAccount = await User.findOne({ email: OnairosUsername });
        console.log(`[DEBUG] Found by email:`, targetAccount ? `Yes (ID: ${targetAccount._id}, userName: ${targetAccount.userName})` : 'No');
    }

    if (targetAccount) {
        console.log(`[DEBUG] Found user: ${targetAccount.userName || targetAccount.email} (ID: ${targetAccount._id})`);
        
        // Validate refresh token presence
        if (!refresh_token) {
            console.error(`[DEBUG] ⚠️  WARNING: No refresh token received for user ${OnairosUsername}`);
            console.error(`[DEBUG] This means the user will need to reconnect when the access token expires`);
            console.error(`[DEBUG] Ensure OAuth flow includes access_type: 'offline' and prompt: 'consent'`);
        }
        
        const updateData = {
            'accounts.youtube.userName': youtubeChannelTitle,
            'accounts.youtube.accessToken': token,
            'accounts.youtube.tokenExpiry': expiryDate,
            'accounts.youtube.connectedAt': new Date(),
            'accounts.youtube.hasRefreshToken': !!refresh_token
        };
        
        // Only save refresh token if it exists
        if (refresh_token) {
            updateData['accounts.youtube.refreshToken'] = refresh_token;
            console.log(`[DEBUG] ✅ Refresh token saved for user ${OnairosUsername}`);
        } else {
            console.log(`[DEBUG] ❌ No refresh token to save for user ${OnairosUsername}`);
        }
        
        await User.updateOne(
            { _id: targetAccount._id },
            { $set: updateData }
        );

        if (!targetAccount.connections || !('YouTube' in targetAccount.connections)) {
            const updateField = {};
            updateField[`connections.YouTube`] = '-';

            await User.updateOne(
                { _id: targetAccount._id },
                { $set: updateField }
            );
        }
        
        console.log(`[DEBUG] Successfully updated user with YouTube connection`);
        console.log(`[DEBUG] - Access token: ${token ? 'Present' : 'Missing'}`);
        console.log(`[DEBUG] - Refresh token: ${refresh_token ? 'Present' : 'Missing'}`);
        console.log(`[DEBUG] - Token expiry: ${expiryDate}`);
        console.log(`[DEBUG] - Channel name: ${youtubeChannelTitle}`);
    } else {
        console.error('[DEBUG] Account doesn\'t exist after checking both userName and email:', OnairosUsername);
        throw new Error('Account doesn\'t exist');
    }
}

export default router; 