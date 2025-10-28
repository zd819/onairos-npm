/**
 * API Configuration for Onairos
 * Centralized configuration for API endpoints
 */

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.port === '3000' ||
                     window.location.port === '5173' ||
                     window.location.port === '8080';

// Allow override via environment variable or window object
const forceProduction = window.ONAIROS_FORCE_PRODUCTION || 
                       (typeof process !== 'undefined' && process.env?.VITE_ONAIROS_FORCE_PRODUCTION === 'true');

// API Configuration
export const API_CONFIG = {
  // Base URLs
  DEVELOPMENT_URL: 'http://localhost:8080',
  PRODUCTION_URL: 'https://api2.onairos.uk',
  
  // Current environment
  IS_DEVELOPMENT: isDevelopment,
  
  // Get base URL based on environment
  getBaseUrl() {
    // Force production URL if needed
    // return this.PRODUCTION_URL; // Uncomment to always use production
    
    // Check for force production override
    if (forceProduction) {
      return this.PRODUCTION_URL;
    }
    
    return this.IS_DEVELOPMENT ? this.DEVELOPMENT_URL : this.PRODUCTION_URL;
  },
  
  // Email verification endpoints
  EMAIL_VERIFY: '/email/verify',
  EMAIL_VERIFY_CONFIRM: '/email/verify/confirm',
  
  // Get full URLs
  getEmailVerifyUrl() {
    return `${this.getBaseUrl()}${this.EMAIL_VERIFY}`;
  },
  
  getEmailVerifyConfirmUrl() {
    return `${this.getBaseUrl()}${this.EMAIL_VERIFY_CONFIRM}`;
  },
  
  // Debug info
  getDebugInfo() {
    return {
      environment: this.IS_DEVELOPMENT ? 'development' : 'production',
      baseUrl: this.getBaseUrl(),
      hostname: window.location.hostname,
      port: window.location.port,
      emailVerifyUrl: this.getEmailVerifyUrl(),
      emailVerifyConfirmUrl: this.getEmailVerifyConfirmUrl()
    };
  }
};

// Log configuration on load
console.log('🔧 API Configuration loaded:', API_CONFIG.getDebugInfo());

export default API_CONFIG;

