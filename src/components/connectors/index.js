/**
 * OAuth Connectors Index
 * Exports all available OAuth connector components
 */

// LLM Connectors (with browser extension detection)
export { default as ChatGPTConnector } from './ChatGPTConnector';
export { default as ClaudeConnector } from './ClaudeConnector';
export { default as GeminiConnector } from './GeminiConnector';
export { default as GrokConnector } from './GrokConnector';

// OAuth Connectors (traditional social media platforms)
export { default as YoutubeConnector } from './YoutubeConnector';
export { default as LinkedInConnector } from './LinkedInConnector';
export { default as InstagramConnector } from './InstagramConnector';
export { default as PinterestConnector } from './PinterestConnector';
export { default as RedditConnector } from './RedditConnector';
export { default as GmailConnector } from './GmailConnector';

// Platform configuration for easy reference
export const SUPPORTED_PLATFORMS = [
  // LLM Platforms (require browser extension)
  { name: 'ChatGPT', connector: 'chatgpt', endpoint: null, type: 'llm', url: 'https://chatgpt.com' },
  { name: 'Claude', connector: 'claude', endpoint: null, type: 'llm', url: 'https://claude.ai' },
  { name: 'Gemini', connector: 'gemini', endpoint: null, type: 'llm', url: 'https://gemini.google.com' },
  { name: 'Grok', connector: 'grok', endpoint: null, type: 'llm', url: 'https://grok.x.ai' },
  
  // OAuth Platforms (traditional social media)
  { name: 'YouTube', connector: 'youtube', endpoint: '/youtube/authorize', type: 'oauth' },
  { name: 'LinkedIn', connector: 'linkedin', endpoint: '/linkedin/authorize', type: 'oauth' },
  { name: 'Instagram', connector: 'instagram', endpoint: '/instagram/authorize', type: 'oauth' },
  { name: 'Pinterest', connector: 'pinterest', endpoint: '/pinterest/authorize', type: 'oauth' },
  { name: 'Reddit', connector: 'reddit', endpoint: '/reddit/authorize', type: 'oauth' },
  { name: 'Gmail', connector: 'gmail', endpoint: '/gmail/authorize', type: 'oauth' }
]; 