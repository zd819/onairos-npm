/**
 * Session Management Utility
 * Handles persistent login sessions with token validation and expiration
 * Industry standard: 30-day session duration (configurable)
 * 
 * Similar to "Sign in with Google" or "Sign in with Apple" behavior
 */

import { API_CONFIG } from '../config/api-config.js';

// Session configuration (industry standard)
const SESSION_CONFIG = {
  // 30 days in milliseconds (industry standard for "Remember Me")
  DEFAULT_SESSION_DURATION: 30 * 24 * 60 * 60 * 1000,
  
  // 7 days for shorter sessions
  SHORT_SESSION_DURATION: 7 * 24 * 60 * 60 * 1000,
  
  // Cookie name for fallback storage
  COOKIE_NAME: 'onairos_session',
  
  // localStorage keys
  STORAGE_KEYS: {
    USER_DATA: 'onairosUser',
    USER_TOKEN: 'onairos_user_token',
    SESSION_EXPIRY: 'onairos_session_expiry'
  }
};

/**
 * Check if a session is still valid (not expired)
 * @param {string|null} expiryTimestamp - ISO timestamp or null
 * @returns {boolean} True if session is still valid
 */
export function isSessionValid(expiryTimestamp = null) {
  try {
    // Get expiry from parameter or storage
    const expiry = expiryTimestamp || localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.SESSION_EXPIRY);
    
    if (!expiry) {
      console.log('📅 No session expiry found - session invalid');
      return false;
    }
    
    const expiryDate = new Date(expiry);
    const now = new Date();
    
    const isValid = now < expiryDate;
    
    if (isValid) {
      const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      console.log(`✅ Session valid - expires in ${daysRemaining} days`);
    } else {
      console.log(`❌ Session expired on ${expiryDate.toLocaleDateString()}`);
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error checking session validity:', error);
    return false;
  }
}

/**
 * Get current session expiry timestamp
 * @returns {string|null} ISO timestamp or null
 */
export function getSessionExpiry() {
  try {
    return localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.SESSION_EXPIRY);
  } catch (error) {
    console.error('❌ Error getting session expiry:', error);
    return null;
  }
}

/**
 * Set or extend session expiry
 * @param {number} duration - Duration in milliseconds (default: 30 days)
 * @returns {string} New expiry timestamp
 */
export function setSessionExpiry(duration = SESSION_CONFIG.DEFAULT_SESSION_DURATION) {
  try {
    const expiry = new Date(Date.now() + duration);
    const expiryISO = expiry.toISOString();
    
    localStorage.setItem(SESSION_CONFIG.STORAGE_KEYS.SESSION_EXPIRY, expiryISO);
    
    // Also set cookie as fallback
    setCookie(SESSION_CONFIG.COOKIE_NAME, expiryISO, duration);
    
    console.log(`🕐 Session expiry set to: ${expiry.toLocaleString()} (${Math.ceil(duration / (1000 * 60 * 60 * 24))} days)`);
    
    return expiryISO;
  } catch (error) {
    console.error('❌ Error setting session expiry:', error);
    return null;
  }
}

/**
 * Extend existing session (bump expiry forward)
 * Called on user activity to keep session alive
 * @param {number} duration - Duration in milliseconds (default: 30 days)
 */
export function extendSession(duration = SESSION_CONFIG.DEFAULT_SESSION_DURATION) {
  if (isSessionValid()) {
    setSessionExpiry(duration);
    console.log('🔄 Session extended');
  }
}

/**
 * Validate JWT token by decoding and checking expiration
 * @param {string} token - JWT token
 * @returns {Object} { valid: boolean, payload: object|null, error: string|null }
 */
export function validateToken(token) {
  try {
    if (!token) {
      return { valid: false, payload: null, error: 'No token provided' };
    }
    
    // Decode JWT (don't verify signature - backend will do that)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, payload: null, error: 'Invalid token format' };
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has required fields
    if (!payload.email && !payload.id && !payload.userId && !payload.sub) {
      return { valid: false, payload: null, error: 'Token missing user identifier' };
    }
    
    // Check token expiration if present
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (now >= payload.exp) {
        return { valid: false, payload, error: 'Token expired' };
      }
    }
    
    return { valid: true, payload, error: null };
  } catch (error) {
    console.error('❌ Error validating token:', error);
    return { valid: false, payload: null, error: error.message };
  }
}

/**
 * Get stored authentication token
 * @returns {string|null} JWT token or null
 */
export function getStoredToken() {
  try {
    // Try localStorage first
    let token = localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.USER_TOKEN);
    
    // Fallback to userData.token
    if (!token) {
      const userData = localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.USER_DATA);
      if (userData) {
        const parsed = JSON.parse(userData);
        token = parsed.token;
      }
    }
    
    // Fallback to cookie
    if (!token) {
      token = getCookie('onairos_token');
    }
    
    return token;
  } catch (error) {
    console.error('❌ Error getting stored token:', error);
    return null;
  }
}

/**
 * Check if user has a valid session (can skip login)
 * @returns {Object} { hasSession: boolean, userData: object|null, shouldSkipLogin: boolean }
 */
export function checkValidSession() {
  try {
    // Check if session is expired
    if (!isSessionValid()) {
      console.log('❌ Session expired - user must re-authenticate');
      return { hasSession: false, userData: null, shouldSkipLogin: false };
    }
    
    // Get user data
    const userDataStr = localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.USER_DATA);
    if (!userDataStr) {
      console.log('❌ No user data found');
      return { hasSession: false, userData: null, shouldSkipLogin: false };
    }
    
    const userData = JSON.parse(userDataStr);
    
    // Check if user completed onboarding and PIN
    if (!userData.onboardingComplete || !userData.pinCreated) {
      console.log('⚠️ User session exists but onboarding incomplete');
      return { hasSession: true, userData, shouldSkipLogin: false };
    }
    
    // Validate token if present
    const token = getStoredToken();
    if (token) {
      const validation = validateToken(token);
      if (!validation.valid) {
        console.log(`❌ Token invalid: ${validation.error}`);
        return { hasSession: true, userData, shouldSkipLogin: false };
      }
    }
    
    console.log('✅ Valid session found - can skip login!');
    console.log(`   User: ${userData.email || userData.username}`);
    console.log(`   Expiry: ${getSessionExpiry()}`);
    
    return {
      hasSession: true,
      userData,
      shouldSkipLogin: true
    };
  } catch (error) {
    console.error('❌ Error checking valid session:', error);
    return { hasSession: false, userData: null, shouldSkipLogin: false };
  }
}

/**
 * Create or update session after successful login
 * @param {Object} userData - User data object
 * @param {string} token - JWT token
 * @param {number} duration - Session duration in milliseconds (default: 30 days)
 */
export function createSession(userData, token = null, duration = SESSION_CONFIG.DEFAULT_SESSION_DURATION) {
  try {
    console.log('🔐 Creating persistent session...');
    
    // Add session metadata
    const sessionData = {
      ...userData,
      token: token || userData.token,
      lastSessionTime: new Date().toISOString(),
      sessionCreatedAt: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem(SESSION_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(sessionData));
    
    if (sessionData.token) {
      localStorage.setItem(SESSION_CONFIG.STORAGE_KEYS.USER_TOKEN, sessionData.token);
      // Also set token cookie
      setCookie('onairos_token', sessionData.token, duration);
    }
    
    // Set session expiry
    setSessionExpiry(duration);
    
    console.log('✅ Session created successfully');
    console.log(`   Duration: ${Math.ceil(duration / (1000 * 60 * 60 * 24))} days`);
    console.log(`   User: ${sessionData.email || sessionData.username}`);
    
    return sessionData;
  } catch (error) {
    console.error('❌ Error creating session:', error);
    return null;
  }
}

/**
 * Destroy current session (logout)
 */
export function destroySession() {
  try {
    console.log('🚪 Destroying session...');
    
    // Clear localStorage
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEYS.USER_TOKEN);
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEYS.SESSION_EXPIRY);
    
    // Clear cookies
    deleteCookie(SESSION_CONFIG.COOKIE_NAME);
    deleteCookie('onairos_token');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('✅ Session destroyed');
  } catch (error) {
    console.error('❌ Error destroying session:', error);
  }
}

/**
 * Refresh session on user activity (bump expiry forward)
 */
export function refreshSessionOnActivity() {
  if (isSessionValid()) {
    extendSession();
  }
}

// ============================================
// Cookie Utilities (Fallback for localStorage)
// ============================================

/**
 * Set a cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} maxAge - Max age in milliseconds
 */
function setCookie(name, value, maxAge = SESSION_CONFIG.DEFAULT_SESSION_DURATION) {
  try {
    const maxAgeSeconds = Math.floor(maxAge / 1000);
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    const sameSite = '; SameSite=Lax';
    
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/${secure}${sameSite}`;
  } catch (error) {
    console.warn('⚠️ Could not set cookie:', error);
  }
}

/**
 * Get a cookie value
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null
 */
function getCookie(name) {
  try {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    
    return null;
  } catch (error) {
    console.warn('⚠️ Could not get cookie:', error);
    return null;
  }
}

/**
 * Delete a cookie
 * @param {string} name - Cookie name
 */
function deleteCookie(name) {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  } catch (error) {
    console.warn('⚠️ Could not delete cookie:', error);
  }
}

/**
 * Get session duration options
 * @returns {Object} Duration options in milliseconds
 */
export function getSessionDurations() {
  return {
    SHORT: SESSION_CONFIG.SHORT_SESSION_DURATION,   // 7 days
    DEFAULT: SESSION_CONFIG.DEFAULT_SESSION_DURATION, // 30 days
    CUSTOM: (days) => days * 24 * 60 * 60 * 1000
  };
}

/**
 * Get session info for debugging
 * @returns {Object} Session information
 */
export function getSessionInfo() {
  const expiry = getSessionExpiry();
  const isValid = isSessionValid(expiry);
  const token = getStoredToken();
  const tokenValidation = token ? validateToken(token) : { valid: false };
  
  return {
    hasExpiry: !!expiry,
    expiry: expiry,
    isValid: isValid,
    hasToken: !!token,
    tokenValid: tokenValidation.valid,
    tokenPayload: tokenValidation.payload,
    daysRemaining: expiry ? Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24)) : 0
  };
}

export default {
  isSessionValid,
  getSessionExpiry,
  setSessionExpiry,
  extendSession,
  validateToken,
  getStoredToken,
  checkValidSession,
  createSession,
  destroySession,
  refreshSessionOnActivity,
  getSessionDurations,
  getSessionInfo,
  SESSION_CONFIG
};

