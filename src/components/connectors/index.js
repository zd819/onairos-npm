/**
 * OAuth Connectors Index
 * Exports all available OAuth connector components
 */

export { default as ChatGPTConnector } from './ChatGPTConnector';
export { default as YoutubeConnector } from './YoutubeConnector';
export { default as LinkedInConnector } from './LinkedInConnector';
export { default as InstagramConnector } from './InstagramConnector';
export { default as PinterestConnector } from './PinterestConnector';
export { default as RedditConnector } from './RedditConnector';
export { default as GmailConnector } from './GmailConnector';

// Platform configuration for easy reference
export const SUPPORTED_PLATFORMS = [
  { name: 'ChatGPT', connector: 'chatgpt', endpoint: null }, // Special handling - opens chatgpt.com directly
  { name: 'YouTube', connector: 'youtube', endpoint: '/youtube/authorize' },
  { name: 'LinkedIn', connector: 'linkedin', endpoint: '/linkedin/authorize' },
  { name: 'Instagram', connector: 'instagram', endpoint: '/instagram/authorize' },
  { name: 'Pinterest', connector: 'pinterest', endpoint: '/pinterest/authorize' },
  { name: 'Reddit', connector: 'reddit', endpoint: '/reddit/authorize' },
  { name: 'Gmail', connector: 'gmail', endpoint: '/gmail/authorize' }
]; 