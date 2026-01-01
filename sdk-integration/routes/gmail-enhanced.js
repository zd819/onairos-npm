import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { authenticateApiKey, smartAuth } from '../middleware/unifiedApiKeyAuth.js';
import { TokenManager } from '../utils/tokenManager.js';
import { ConnectionHealthMonitor } from '../utils/connectionHealth.js';
import { DatabaseUtils } from '../utils/databaseUtils.js';
import { oauthConfig } from '../config/oauth-config.js';
import { sdkConfig } from '../config/sdk-config.js';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { User } from '../../Mongoose/models.js';
import { getEnochModels } from '../../utils/enochDb.js';

dotenv.config();

const router = express.Router();
const tokenManager = new TokenManager();
const healthMonitor = new ConnectionHealthMonitor();
const dbUtils = new DatabaseUtils();

// Gmail OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID, // Fallback to YouTube credentials
    process.env.GMAIL_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI || 'https://api2.onairos.uk/gmail/callback'
);

// OAuth configuration validation on startup
if (!process.env.GMAIL_CLIENT_ID && !process.env.YOUTUBE_CLIENT_ID) {
  console.error('❌ Missing Gmail OAuth credentials - using YouTube credentials as fallback');
}

/**
 * Gmail OAuth Authorization Endpoint
 * 
 * Initiates Gmail OAuth flow by generating authorization URL
 * Compatible with existing Gmail connector frontend implementation
 */
router.post('/authorize', (req, res) => {
    try {
        console.log('📧 Gmail OAuth authorization request received');
        
        const clientId = process.env.GMAIL_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
        const redirectUri = process.env.GMAIL_REDIRECT_URI || 'https://api2.onairos.uk/gmail/callback';
        
        // Gmail-specific scopes
        const scope = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.metadata',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'openid'
        ];

        const stateObject = {
            connectionType: 'gmail',
            timestamp: Date.now(),
            username: req.body.session?.username || 'unknown_user',
        };
        const state = Buffer.from(JSON.stringify(stateObject)).toString('base64');

        const authorizationUrl = oauth2Client.generateAuthUrl({
            redirect_uri: redirectUri,
            access_type: 'offline',
            scope: scope,
            state: state,
            prompt: 'consent',
            include_granted_scopes: true
        });
        
        console.log('🔗 Generated Gmail OAuth URL:', authorizationUrl);
        res.json({ gmailURL: authorizationUrl });
        
    } catch (error) {
        console.error('❌ Gmail OAuth authorization error:', error);
        res.status(500).json({ 
            error: 'Failed to generate Gmail authorization URL',
            message: error.message 
        });
    }
});

/**
 * Gmail OAuth Callback Handler
 * 
 * Handles the OAuth callback from Google and exchanges code for tokens
 */
router.get('/callback', async (req, res) => {
    try {
        console.log('📧 Gmail OAuth callback received');
        const { code, state: stateParam } = req.query;
        
        if (!code) {
            console.error('❌ No authorization code received');
            return res.status(400).send('Authorization code missing');
        }

        const stateObject = JSON.parse(Buffer.from(stateParam, 'base64').toString('utf8'));
        console.log('📋 State object:', stateObject);
        
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code).catch(err => {
            console.error("❌ Error getting Gmail tokens: ", err);
            res.status(500).send('Error retrieving Gmail tokens');
            return;
        });

        if (!tokens) {
            console.error('❌ No Gmail tokens received');
            res.status(500).send('No Gmail tokens received');
            return;
        }
        
        console.log("✅ Gmail OAuth2 Tokens received for code: ", code);
        const { access_token, refresh_token, expiry_date } = tokens;

        try {
            // Get Gmail profile information
            const gmailResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                },
            });

            const gmailData = await gmailResponse.json();
            console.log("📧 Gmail Profile Data: ", gmailData);
            const gmailEmail = gmailData.email || "No Email Available";
            const gmailName = gmailData.name || "Gmail User";

            // Update user with Gmail connection
            await updateUserWithGmailConnection(
                stateObject.username, 
                gmailEmail, 
                gmailName, 
                access_token, 
                refresh_token, 
                expiry_date
            );
            
            console.log('✅ Gmail connection updated successfully');
            
            // Redirect to oauth-callback.html with success signal
            // This allows the frontend to properly detect the connection and update UI
            res.redirect(`https://api2.onairos.uk/oauth-callback.html?success=true&platform=gmail&email=${encodeURIComponent(gmailEmail)}`);

        } catch (error) {
            console.error('❌ Failed to retrieve Gmail data:', error);
            res.status(500).send('Failed to retrieve Gmail data');
        }
    } catch (error) {
        console.error('❌ Error in Gmail Callback:', error);
        res.status(500).send('Error in Gmail Callback: ' + error.message);
    }
});

/**
 * Enhanced Gmail Native Authentication
 * 
 * Similar to LinkedIn/YouTube native auth but for Gmail
 */
router.post('/native-auth', smartAuth, async (req, res) => {
    const requestId = Date.now().toString(36);
    console.log(`📧 [${requestId}] Gmail native auth request started`);
    
    try {
        const { idToken, accessToken, serverAuthCode, username } = req.body;
        
        // Verify Google token if provided
        let payload = null;
        if (idToken) {
            payload = await verifyGoogleToken(idToken);
        }
        
        let tokens = null;
        if (serverAuthCode) {
            // Exchange the serverAuthCode for tokens
            const tokenResponse = await oauth2Client.getToken(serverAuthCode);
            tokens = tokenResponse.tokens;
        } else if (accessToken) {
            // Use provided access token
            tokens = { access_token: accessToken };
        }

        if (!tokens) {
            return res.status(400).json({
                success: false,
                error: 'No valid tokens provided'
            });
        }
        
        console.log(`📧 [${requestId}] Gmail tokens obtained`);
        const { access_token, refresh_token, expiry_date } = tokens;

        // Get Gmail profile information
        const gmailResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${access_token}`,
            },
        });
        
        const gmailData = await gmailResponse.json();
        console.log(`📧 [${requestId}] Gmail profile data:`, gmailData);
        
        const gmailEmail = gmailData.email || "No Email Available";
        const gmailName = gmailData.name || "Gmail User";
        const userIdentifier = username || payload?.email || gmailEmail;

        await updateUserWithGmailConnection(
            userIdentifier, 
            gmailEmail, 
            gmailName, 
            access_token, 
            refresh_token, 
            expiry_date
        );
        
        console.log(`✅ [${requestId}] Gmail native auth completed successfully`);
        res.status(200).json({ 
            success: true,
            valid: true,
            email: gmailEmail,
            name: gmailName
        });

    } catch (error) {
        console.error(`❌ [${requestId}] Error in Gmail native auth:`, error);
        res.status(500).json({
            success: false,
            error: 'Gmail authentication failed',
            message: error.message
        });
    }
});

/**
 * Update user with Gmail connection information
 */
async function updateUserWithGmailConnection(username, email, name, accessToken, refreshToken, expiryDate) {
    try {
        console.log(`📧 Updating user ${username} with Gmail connection`);
        
        const updateData = {
            'accounts.gmail': {
                email: email,
                name: name,
                connected: true,
                accessToken: accessToken,
                refreshToken: refreshToken,
                expiryDate: expiryDate,
                lastUpdated: new Date()
            }
        };

        // Try to update in main Onairos database
        const result = await User.findOneAndUpdate(
            { username: username },
            { $set: updateData },
            { new: true, upsert: false }
        );

        if (result) {
            console.log(`✅ Gmail connection updated in Onairos DB for user: ${username}`);
        } else {
            console.log(`⚠️ User ${username} not found in Onairos DB, trying Enoch DB`);
            
            // Try Enoch database as fallback
            try {
                const { EnochUser } = await getEnochModels();
                const enochResult = await EnochUser.findOneAndUpdate(
                    { email: username },
                    { $set: { [`connections.gmail`]: updateData['accounts.gmail'] } },
                    { new: true, upsert: false }
                );
                
                if (enochResult) {
                    console.log(`✅ Gmail connection updated in Enoch DB for user: ${username}`);
                } else {
                    console.log(`⚠️ User ${username} not found in either database`);
                }
            } catch (enochError) {
                console.error('❌ Error updating Enoch DB:', enochError);
            }
        }
        
    } catch (error) {
        console.error('❌ Error updating user with Gmail connection:', error);
        throw error;
    }
}

/**
 * Verify Google ID token
 */
async function verifyGoogleToken(idToken) {
    try {
        const ticket = await oauth2Client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GMAIL_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID,
        });
        return ticket.getPayload();
    } catch (error) {
        console.error('❌ Error verifying Google token:', error);
        throw error;
    }
}

export default router;
