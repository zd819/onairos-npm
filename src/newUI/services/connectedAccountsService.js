/**
 * Connected Accounts Service
 * Provides platform icons and related utilities
 */

/**
 * Get platform icon (emoji, image path, or component)
 * @param {string} platform - Platform name
 * @returns {string|object} - Platform icon emoji or image component
 */
export function getPlatformIcon(platform) {
  const platformLower = platform.toLowerCase();
  
  // Special handling for ChatGPT - return image component
  if (platformLower === 'chatgpt') {
    return {
      type: 'image',
      src: '/chatgpt-icon.png',
      alt: 'ChatGPT',
      fallback: '🤖'
    };
  }
  
  // Regular emoji icons for other platforms
  const icons = {
    youtube: '📺',
    linkedin: '💼',
    instagram: '📷',
    pinterest: '📌',
    reddit: '🔥',
    gmail: '📧',
    facebook: '📘',
    twitter: '🐦',
    tiktok: '🎵',
    snapchat: '👻',
    discord: '🎮',
    spotify: '🎵',
    apple: '🍎',
    google: '🔍'
  };
  
  return icons[platformLower] || '🔗';
}

/**
 * Get platform color
 * @param {string} platform - Platform name
 * @returns {string} - Platform color class
 */
export function getPlatformColor(platform) {
  const colors = {
    chatgpt: 'bg-green-600',
    youtube: 'bg-red-500',
    linkedin: 'bg-blue-700',
    instagram: 'bg-pink-500',
    pinterest: 'bg-red-600',
    reddit: 'bg-orange-500',
    gmail: 'bg-red-500',
    facebook: 'bg-blue-600',
    twitter: 'bg-blue-400',
    tiktok: 'bg-black',
    snapchat: 'bg-yellow-400',
    discord: 'bg-indigo-600',
    spotify: 'bg-green-500',
    apple: 'bg-gray-800',
    google: 'bg-blue-500'
  };
  
  return colors[platform.toLowerCase()] || 'bg-gray-500';
}

/**
 * Get platform display name
 * @param {string} platform - Platform name
 * @returns {string} - Platform display name
 */
export function getPlatformDisplayName(platform) {
  const names = {
    chatgpt: 'ChatGPT',
    youtube: 'YouTube',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    pinterest: 'Pinterest',
    reddit: 'Reddit',
    gmail: 'Gmail',
    facebook: 'Facebook',
    twitter: 'Twitter',
    tiktok: 'TikTok',
    snapchat: 'Snapchat',
    discord: 'Discord',
    spotify: 'Spotify',
    apple: 'Apple',
    google: 'Google'
  };
  
  return names[platform.toLowerCase()] || platform;
}

/**
 * Check if platform supports OAuth
 * @param {string} platform - Platform name
 * @returns {boolean} - Whether platform supports OAuth
 */
export function supportsOAuth(platform) {
  const oauthPlatforms = [
    'youtube', 'linkedin', 'instagram', 'pinterest', 
    'reddit', 'gmail', 'facebook', 'twitter', 'google'
  ];
  
  return oauthPlatforms.includes(platform.toLowerCase());
}

/**
 * Check if platform has special behavior
 * @param {string} platform - Platform name
 * @returns {boolean} - Whether platform has special behavior
 */
export function hasSpecialBehavior(platform) {
  const specialPlatforms = ['chatgpt'];
  return specialPlatforms.includes(platform.toLowerCase());
}

export default {
  getPlatformIcon,
  getPlatformColor,
  getPlatformDisplayName,
  supportsOAuth,
  hasSpecialBehavior
};
