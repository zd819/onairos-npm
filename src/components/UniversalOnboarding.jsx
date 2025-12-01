import React, { useEffect, useId, useState, useRef } from 'react';
import Lottie from 'lottie-react';
import personaAnim from '../../public/persona-anim.json';
const chatgptIcon = 'https://anushkasirv.sirv.com/openai.png';
const claudeIcon = 'https://anushkasirv.sirv.com/claude-color.png';
const geminiIcon = 'https://anushkasirv.sirv.com/gemini-color.png';
const grokIcon = 'https://anushkasirv.sirv.com/grok.png';

const sdkConfig = {
  apiKey: process.env.REACT_APP_ONAIROS_API_KEY || 'ona_VvoHNg1fdCCUa9eBy4Iz3IfvXdgLfMFI7TNcyHLDKEadPogkbjAeE2iDOs6M7Aey',
  baseUrl: process.env.REACT_APP_ONAIROS_BASE_URL || 'https://api2.onairos.uk',
  sdkType: 'web',
  enableHealthMonitoring: true,
  enableAutoRefresh: true,
  enableConnectionValidation: true,
};

// Bookmarklet users can drag to their bookmarks bar and click on chatgpt.com.
// It reads ChatGPT's accessToken (using ChatGPT's own cookies) and posts it
// back to the SDK window via window.opener.postMessage. The SDK then calls
// /llm-data/scrape-chatgpt from a trusted origin (not blocked by CSP).
const CHATGPT_BOOKMARKLET = `javascript:(async()=>{try{if(location.hostname!=='chatgpt.com'){alert('Open this on https://chatgpt.com first, then click the bookmark again.');return;}if(!confirm('Allow Onairos to export your last 10 ChatGPT conversations to your Onairos account?'))return;const r=await fetch('https://chatgpt.com/api/auth/session',{credentials:'include'});if(!r.ok){alert('Could not get ChatGPT session. Please make sure you are logged in.');return;}const s=await r.json().catch(()=>null);if(!s||!s.accessToken){alert('No accessToken found in ChatGPT session. Try refreshing the page and logging in again.');console.log('Onairos ChatGPT: session payload:',s);return;}if(!window.opener){alert('Could not find Onairos window. Please open ChatGPT from the Onairos popup and try again.');return;}window.opener.postMessage({type:'onairos_chatgpt_access_token',accessToken:s.accessToken},'*');alert('Sent ChatGPT access token to Onairos. You can close this tab now.');}catch(e){console.error('Onairos ChatGPT bookmarklet error:',e);alert('Onairos ChatGPT error: '+(e.message||e));}})();`;

const fadeSlideInKeyframes = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateX(var(--slide-x)); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
@keyframes pulseGlow {
  0% {
    box-shadow: 0 0 0 0 rgba(248,113,113,0.7), 0 0 16px rgba(248,113,113,0.6), 0 0 32px rgba(59,130,246,0.5);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(248,113,113,0), 0 0 22px rgba(248,113,113,0.9), 0 0 44px rgba(59,130,246,0.7);
    transform: scale(1.04);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(248,113,113,0.7), 0 0 16px rgba(248,113,113,0.6), 0 0 32px rgba(59,130,246,0.5);
    transform: scale(1);
  }
}
@keyframes modalFade {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
`;

// Extract ChatGPT chats via backend proxy. Optionally accepts a ChatGPT accessToken
// (provided by the bookmarklet running on chatgpt.com).
async function scrapeChatGPTChats(accessToken) {
  try {
    console.log('🧲 Starting ChatGPT chat extraction (Flutter methodology)...');

    const baseUrl = sdkConfig.baseUrl;
    
    // Try multiple possible token storage locations
    // Check all localStorage keys that might contain a token
    const possibleKeys = [
      'onairos_user_token',
      'onairos_jwt_token', 
      'jwtToken',
      'token',
      'authToken',
      'accessToken'
    ];
    
    let jwtToken = null;
    
    // FIRST: Check the primary storage location (where it's saved after email auth)
    // This is set in onairosButton.jsx line 129: localStorage.setItem('onairos_user_token', candidate)
    const primaryToken = localStorage.getItem('onairos_user_token');
    if (primaryToken && primaryToken.length > 20) {
      // Validate it's a JWT (has 3 parts separated by dots)
      const parts = primaryToken.split('.');
      if (parts.length === 3) {
        jwtToken = primaryToken;
        console.log(`✅ Found JWT token in: onairos_user_token (primary location)`);
      } else {
        console.log(`⚠️ onairos_user_token exists but doesn't look like a JWT (${parts.length} parts)`);
      }
    }
    
    // SECOND: Check onairosUser object (authData is spread into it, so token should be there)
    if (!jwtToken) {
      try {
        const userDataStr = localStorage.getItem('onairosUser');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          // authData from EmailAuth has: token, jwtToken, accessToken
          if (userData.token || userData.jwtToken || userData.accessToken) {
            const candidate = userData.token || userData.jwtToken || userData.accessToken;
            const parts = candidate.split('.');
            if (parts.length === 3 && candidate.length > 20) {
              jwtToken = candidate;
              console.log(`✅ Found JWT token in: onairosUser.${userData.token ? 'token' : userData.jwtToken ? 'jwtToken' : 'accessToken'}`);
            }
          }
        }
      } catch (e) {
        console.log('Could not check onairosUser for token:', e);
      }
    }
    
    // THIRD: Check other possible keys
    if (!jwtToken) {
      for (const key of possibleKeys) {
        if (key === 'onairos_user_token') continue; // Already checked
        const value = localStorage.getItem(key);
        if (value && value.length > 20) {
          const parts = value.split('.');
          if (parts.length === 3) {
            jwtToken = value;
            console.log(`✅ Found JWT token in: ${key}`);
            break;
          }
        }
      }
    }
    
    // FOURTH: Check window object
    if (!jwtToken && typeof window !== 'undefined') {
      jwtToken = window.onairosToken || window.onairosJWT || null;
      if (jwtToken) console.log('✅ Found JWT token in window object');
    }

    console.log('🔑 JWT token check:', {
      hasToken: !!jwtToken,
      tokenLength: jwtToken ? jwtToken.length : 0,
      storageKeys: possibleKeys.map(k => ({
        key: k,
        exists: !!localStorage.getItem(k),
        value: localStorage.getItem(k) ? localStorage.getItem(k).substring(0, 20) + '...' : null
      }))
    });
    
    // Debug: log all localStorage keys to see what's available
    if (!jwtToken) {
      console.log('🔍 All localStorage keys:', Object.keys(localStorage));
      console.log('🔍 Checking for token in user data...');
      
      // Try to get token from user data object
      try {
        const userDataStr = localStorage.getItem('onairosUser');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          console.log('🔍 onairosUser data keys:', Object.keys(userData));
          console.log('🔍 onairosUser full data (for debugging):', JSON.stringify(userData, null, 2));
          
          // Check multiple possible token fields (Flutter uses jwtToken, web might use token)
          if (userData.token || userData.jwtToken || userData.jwt || userData.accessToken) {
            jwtToken = userData.token || userData.jwtToken || userData.jwt || userData.accessToken;
            console.log('✅ Found token in onairosUser data');
          }
          
          // Also check nested auth objects
          if (!jwtToken && userData.auth) {
            jwtToken = userData.auth.token || userData.auth.jwtToken || null;
            if (jwtToken) console.log('✅ Found token in onairosUser.auth');
          }
        }
      } catch (e) {
        console.log('Could not parse onairosUser:', e);
      }
      
      // Check if token was stored in a different format - scan all localStorage
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        if (key.toLowerCase().includes('token') || key.toLowerCase().includes('jwt')) {
          const value = localStorage.getItem(key);
          if (value && value.length > 20 && !jwtToken) {
            // Try to validate it's a JWT (has 3 parts separated by dots)
            const parts = value.split('.');
            if (parts.length === 3) {
              jwtToken = value;
              console.log(`✅ Found valid JWT token in key: ${key}`);
              break;
            } else {
              console.log(`🔍 Found potential token in key: ${key} (but doesn't look like JWT)`);
            }
          }
        }
      }
    }

    
    if (!jwtToken) {
      console.warn('⚠️ No Onairos JWT token found in localStorage.');
      console.warn('💡 Extraction will still be attempted using ChatGPT cookies (like Flutter).');
      console.warn('💡 However, sending conversations to /llm-data/store may fail without JWT.');
    }

    // At this point, we are in a browser and CORS blocks direct access to:
    // - https://chatgpt.com/api/auth/session
    // - https://chatgpt.com/backend-api/...
    //
    // So instead of calling ChatGPT directly (which fails with CORS),
    // we delegate to a backend proxy endpoint:
    //   POST /llm-data/scrape-chatgpt
    //
    // That endpoint is responsible for implementing server-side scraping
    // (if/when cookies or headless browser are available). For now it
    // returns an empty conversations array with a clear message.

    console.log('📡 Requesting ChatGPT conversations from backend /llm-data/scrape-chatgpt...');

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': sdkConfig.apiKey,
    };
    if (jwtToken) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
    }

    const scrapeResponse = await fetch(`${baseUrl}/llm-data/scrape-chatgpt`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        limit: 10,
        ...(accessToken ? { accessToken } : {}),
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text().catch(() => '');
      console.error('❌ Backend ChatGPT scrape failed:', scrapeResponse.status, errorText);
      throw new Error(`Backend ChatGPT scrape failed: ${scrapeResponse.status}`);
    }

    const scrapeData = await scrapeResponse.json().catch(() => ({}));
    const conversations = scrapeData.conversations || scrapeData.data?.conversations || [];

    if (scrapeData.message) {
      console.log('ℹ️ Backend scrape message:', scrapeData.message);
    }

    console.log('🎉 Backend scraping complete! Conversations:', conversations);
    console.log('📋 Total conversations scraped from backend:', conversations.length);

    // Print chats to console (same style as Flutter)
    conversations.forEach((conv, index) => {
      const title = conv.title || 'Untitled';
      const messages = [];
      
      if (conv.mapping) {
        Object.values(conv.mapping).forEach(node => {
          if (node.message) {
            const msg = node.message;
            const role = msg.author?.role || 'unknown';
            const content = msg.content?.parts?.[0] || '';
            if (content) {
              messages.push({ role, content });
            }
          }
        });
      } else if (Array.isArray(conv.messages)) {
        conv.messages.forEach(msg => {
          if (msg.content) {
            messages.push({ role: msg.role || 'unknown', content: msg.content });
          }
        });
      }
      
      console.log(`\n📝 Conversation ${index + 1}: ${title}`);
      console.log(`   ID: ${conv.id || conv.conversationId}`);
      console.log(`   Messages: ${messages.length}`);
      messages.forEach((msg, idx) => {
        console.log(`   [${msg.role}]: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
      });
    });
    
    // Send each conversation to /llm-data/store (exactly like Flutter)
    console.log('📤 Sending conversations to /llm-data/store (Flutter methodology)...');
    
    for (const conversation of conversations) {
      await sendChatGPTChatsToBackend([conversation]);
    }

    return conversations;
  } catch (error) {
    console.error('❌ Error scraping ChatGPT chats:', error);
    throw error;
  }
}

async function sendChatGPTChatsToBackend(conversations) {
  try {
    const baseUrl = sdkConfig.baseUrl;
    const apiKey = sdkConfig.apiKey;
    
    // Try multiple token locations
    const jwtToken = 
      localStorage.getItem('onairos_user_token') || 
      localStorage.getItem('onairos_jwt_token') ||
      localStorage.getItem('onairosToken') ||
      localStorage.getItem('jwtToken') ||
      (typeof window !== 'undefined' && window.onairosToken) ||
      null;

    if (!jwtToken) {
      console.warn('⚠️ No JWT token found, but attempting to send with API key');
      // Some endpoints might work with just API key
    }

    console.log('📤 Sending chats to /llm-data/store (exact Flutter methodology)...');

    // Send each conversation individually (like Flutter does)
    for (let index = 0; index < conversations.length; index++) {
      const conversation = conversations[index];
      const conversationId = conversation.id || conversation.conversation_id;
      
      if (!conversationId) {
        console.warn(`⚠️ Skipping conversation ${index + 1}: no ID`);
        continue;
      }

      const title = conversation.title || 'Untitled Conversation';
      const createTime = conversation.create_time || Math.floor(Date.now() / 1000);
      const updateTime = conversation.update_time || Math.floor(Date.now() / 1000);
      
      // Extract messages from mapping (EXACT Flutter structure)
      const messages = [];
      if (conversation.mapping) {
        Object.values(conversation.mapping).forEach(node => {
          if (node.message) {
            const msg = node.message;
            const messageId = msg.id;
            const author = msg.author || {};
            const role = author.role;
            const content = msg.content || {};
            const parts = content.parts || [];
            const firstPart = parts[0];
            
            if (messageId && role && firstPart) {
              const timestamp = msg.create_time 
                ? new Date(msg.create_time * 1000).toISOString()
                : new Date().toISOString();
              
              messages.push({
                id: messageId,
                role: role,
                content: firstPart,
                timestamp: timestamp,
                metadata: msg.metadata || {},
              });
            }
          }
        });
      }

      // Sort messages by timestamp (Flutter does this)
      messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      // Build conversationData EXACTLY like Flutter
      const conversationData = {
        conversationId: conversationId,
        messages: messages,
        context: {
          title: title,
          create_time: Math.floor(createTime),
          update_time: Math.floor(updateTime),
        },
        mobileMetadata: {
          platform: 'web', // Web instead of iOS
          appVersion: '1.0.0',
          isOfflineSync: false,
        },
      };

      // Send to /llm-data/store (same endpoint as Flutter)
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token exists
      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      } else {
        // Try with API key as fallback (backend might accept it)
        headers['x-api-key'] = apiKey;
        console.warn('⚠️ Sending without JWT token, using API key');
      }

      const response = await fetch(`${baseUrl}/llm-data/store`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          platform: 'web-chatgpt', // Backend normalizes this
          conversationData: conversationData,
          memoryType: 'conversation',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [${index + 1}/${conversations.length}] Sent conversation "${title}" to backend`);
        console.log(`   Conversation ID: ${result.data?.conversationId || conversationId}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`⚠️ [${index + 1}/${conversations.length}] Failed to send "${title}": ${response.status}`, errorData);
      }
    }

    console.log('✅ All chats sent to /llm-data/store');
  } catch (error) {
    console.error('❌ Error sending chats to backend:', error);
    throw error;
  }
}

export default function UniversalOnboarding({ onComplete }) {
  const lottieRef = useRef(null);
  const lastFrameRef = useRef(0);
  const rafRef = useRef(null);

  const [connectedAccounts, setConnectedAccounts] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [selected, setSelected] = useState('Instagram');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExtractingChats, setIsExtractingChats] = useState(false);
  const [showChatGPTHelp, setShowChatGPTHelp] = useState(false);

  // swipe state
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const FOOTER_H = 88;

  // persona stays as requested (background, unchanged placement)
  const personaSide = Math.min(vh * 0.52, 500);
  const PERSONA_TOP = 96;

  // icon layout (restore tighter spacing on page 1; place the band lower)
  const SLOT = Math.max(56, Math.min(64, Math.floor(vh * 0.07)));
  const CIRCLE = 42;
  const GAP_PAGE1 = 12;
  const GAP_PAGE2 = 20;
  const ACTIVE_SCALE = vh < 760 ? 1.12 : 1.22;

  const ICONS_H = 84;
  const ICONS_TOP_OFFSET = Math.max(180, Math.min(240, Math.round(vh * 0.28))); // ~28vh, clamped for all screens

  const igGradId = useId();

  // ---- official brand SVGs (compact, consistent viewboxes) ----
  const Brand = {
    ChatGPT: <img src={chatgptIcon} alt="ChatGPT" style={{ width: 20, height: 20, objectFit: 'contain' }} />,
    Claude: <img src={claudeIcon} alt="Claude" style={{ width: 20, height: 20, objectFit: 'contain' }} />,
    Gemini: <img src={geminiIcon} alt="Gemini" style={{ width: 20, height: 20, objectFit: 'contain' }} />,
    Grok: <img src={grokIcon} alt="Grok" style={{ width: 20, height: 20, objectFit: 'contain' }} />,
    Instagram: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <defs>
          <radialGradient id={igGradId} cx="0.5" cy="1" r="1">
            <stop offset="0%" stopColor="#FDBB4B"/>
            <stop offset="40%" stopColor="#E95950"/>
            <stop offset="70%" stopColor="#BC2A8D"/>
            <stop offset="100%" stopColor="#4C68D7"/>
          </radialGradient>
        </defs>
        <path fill={`url(#${igGradId})`} d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm0 7.4A2.9 2.9 0 1 1 14.9 12 2.9 2.9 0 0 1 12 14.9Zm5.35-8.25a1.15 1.15 0 1 0 1.15 1.15 1.15 1.15 0 0 0-1.15-1.15Z"/>
      </svg>
    ),
    YouTube: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path fill="#FF0000" d="M22.54 6.42a3 3 0 0 0-2.11-2.12C18.49 3.75 12 3.75 12 3.75s-6.49 0-8.43.55A3 3 0 0 0 1.46 6.42 31.63 31.63 0 0 0 1 12a31.63 31.63 0 0 0 .46 5.58 3 3 0 0 0 2.11 2.12C5.51 20.25 12 20.25 12 20.25s6.49 0 8.43-.55a3 3 0 0 0 2.11-2.12A31.63 31.63 0 0 0 23 12a31.63 31.63 0 0 0-.46-5.58z"/>
        <path fill="#FFF" d="M10 8.75v6.5l6-3.25-6-3.25z"/>
        </svg>
      ),
    Reddit: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="12" fill="#FF4500"/>
        <circle cx="8.75" cy="12.5" r="1.25" fill="#FFF"/>
        <circle cx="15.25" cy="12.5" r="1.25" fill="#FFF"/>
        <path fill="#FFF" d="M7.9 15c.8.8 2.3 1.05 4.1 1.05S15.3 15.8 16.1 15c.2-.2.2-.5 0-.7-.2-.2-.5-.2-.7 0-.6.6-1.9.85-3.4.85S9.3 14.9 8.7 14.3c-.2-.2-.5-.2-.7 0-.2.2-.2.5 0 .7z"/>
        </svg>
      ),
    LinkedIn: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#0A66C2"/>
        <rect x="5" y="9" width="3" height="10" fill="#FFF"/>
        <circle cx="6.5" cy="6.5" r="1.5" fill="#FFF"/>
        <path fill="#FFF" d="M16.8 19H13.9v-5c0-1.2-.5-1.8-1.4-1.8-.9 0-1.6.6-1.6 1.8V19H8V9h2.8v1.3c.5-.8 1.4-1.5 2.7-1.5 2 0 3.3 1.3 3.3 3.7V19z"/>
        </svg>
      ),
    Twitter: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path fill="#1DA1F2" d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/>
        </svg>
      ),
  };

  const aiLinks = {
    ChatGPT: 'https://chat.openai.com',
    Claude: 'https://claude.ai',
    Gemini: 'https://gemini.google.com',
    Grok: 'https://grok.x.ai',
  };

  const descriptions = {
    ChatGPT: <>We analyze your <strong className="font-semibold">prompt style</strong> and <strong className="font-semibold">chat history</strong> to match your writing and thinking patterns.</>,
    Claude: <>We learn your <strong className="font-semibold">document workflow</strong> and <strong className="font-semibold">reasoning preferences</strong> to tune output format and detail.</>,
    Gemini: <>We study your <strong className="font-semibold">search patterns</strong> and <strong className="font-semibold">multimodal usage</strong> to improve response accuracy.</>,
    Grok: <>We adapt to your <strong className="font-semibold">X posting style</strong> and <strong className="font-semibold">meme literacy</strong> to match your tone.</>,
    Twitter: <>We analyze your <strong className="font-semibold">tweets</strong> and <strong className="font-semibold">interests</strong> to understand your preferences.</>,
    YouTube: <>We study your <strong className="font-semibold">watch history</strong> and <strong className="font-semibold">interactions</strong> to learn your interests.</>,
    Reddit: <>We examine your <strong className="font-semibold">search history</strong> and <strong className="font-semibold">discussions</strong> to understand your interests.</>,
    Instagram: <>We analyze your <strong className="font-semibold">photos</strong> and <strong className="font-semibold">interactions</strong> to learn visual preferences.</>,
    LinkedIn: <>We study your <strong className="font-semibold">professional graph</strong> and <strong className="font-semibold">content</strong> to understand career interests.</>,
  };

  const allPlatforms = [
    // Page 1
    { name: 'Instagram', connector: 'instagram', icon: Brand.Instagram },
    { name: 'YouTube', connector: 'youtube', icon: Brand.YouTube },
    { name: 'ChatGPT', connector: 'chatgpt', icon: Brand.ChatGPT },
    // Page 2
    { name: 'Claude', connector: 'claude', icon: Brand.Claude, directLink: aiLinks.Claude },
    { name: 'Gemini', connector: 'gemini', icon: Brand.Gemini, directLink: aiLinks.Gemini },
    { name: 'Twitter', connector: 'twitter', icon: Brand.Twitter },
    // Page 3
    { name: 'LinkedIn', connector: 'linkedin', icon: Brand.LinkedIn },
    { name: 'Reddit', connector: 'reddit', icon: Brand.Reddit },
    { name: 'Grok', connector: 'grok', icon: Brand.Grok, directLink: aiLinks.Grok },
  ];

  const getPlatformsForPage = (page) => {
    if (page === 1) return allPlatforms.slice(0, 3);
    if (page === 2) return allPlatforms.slice(3, 6);
    return allPlatforms.slice(6);
  };

  const platforms = getPlatformsForPage(currentPage);

  // Listen for ChatGPT bookmarklet messages (accessToken → backend extraction)
  useEffect(() => {
    function handleMessage(event) {
      const data = event.data;
      if (!data || data.type !== 'onairos_chatgpt_access_token' || !data.accessToken) {
        return;
      }

      console.log('📥 Received ChatGPT accessToken from bookmarklet');
      setIsExtractingChats(true);

      (async () => {
        try {
          const conversations = await scrapeChatGPTChats(data.accessToken);
          if (conversations.length > 0) {
            console.log('✅ ChatGPT connected and chats extracted successfully via backend');
          } else {
            console.log('ℹ️ ChatGPT extraction completed via backend, but no conversations were returned');
          }
        } catch (err) {
          console.error('❌ Failed to extract ChatGPT chats via backend:', err);
        } finally {
          setIsExtractingChats(false);
        }
      })();
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    // Load OAuth platform returns
    const p = localStorage.getItem('onairos_oauth_platform');
    if (p) {
      localStorage.removeItem('onairos_oauth_platform');
      localStorage.removeItem('onairos_oauth_return');
      setConnectedAccounts((s) => ({ ...s, [p]: true }));
    }
    
    // Load persisted connected accounts from user data
    try {
      const userData = JSON.parse(localStorage.getItem('onairosUser') || '{}');
      if (userData.connectedAccounts && Array.isArray(userData.connectedAccounts)) {
        // Convert array to object format
        const accountsObj = userData.connectedAccounts.reduce((acc, platform) => {
          acc[platform] = true;
          return acc;
        }, {});
        setConnectedAccounts(accountsObj);
      }
    } catch (error) {
      console.warn('Failed to load persisted connected accounts:', error);
    }
  }, []);

  async function connectToPlatform(name) {
    const plat = allPlatforms.find((p) => p.name === name);
    if (!plat) return false;
    try {
      // ChatGPT: show helper modal and let user explicitly open ChatGPT from there
      if (name === 'ChatGPT') {
        console.log('🤖 ChatGPT: Opening ChatGPT so user can run the Onairos bookmarklet');
        setConnectedAccounts((s) => ({ ...s, [name]: true }));
        setIsConnecting(false);
        setConnectingPlatform(null);
        setShowChatGPTHelp(true);

        return true;
      }

      // BYPASS: Twitter endpoint is 404, so just keep toggle ON without API call
      if (name === 'Twitter') {
        console.log('🐦 Twitter: Bypassing API call (endpoint not available), keeping toggle ON');
        setConnectedAccounts((s) => ({ ...s, [name]: true }));
        setIsConnecting(false);
        setConnectingPlatform(null);
        return true;
      }

      // For direct-link platforms (no OAuth), mark connected immediately and return
      if (plat.directLink) {
        setConnectedAccounts((s) => ({ ...s, [name]: true }));
        setIsConnecting(false);
        setConnectingPlatform(null);
        return true;
      }

      // Immediately reflect selection in UI without spinner while starting OAuth
      setConnectedAccounts((s) => ({ ...s, [name]: true }));
      setIsConnecting(true);
      setConnectingPlatform(name);
      
      const username = localStorage.getItem('username') || (JSON.parse(localStorage.getItem('onairosUser') || '{}')?.email) || 'user@example.com';

      console.log(`🔗 Requesting ${name} OAuth URL for username:`, username);
      const res = await fetch(`${sdkConfig.baseUrl}/${plat.connector}/authorize`, {
        method: 'POST', 
        headers: { 
          'x-api-key': sdkConfig.apiKey, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ session: { username } }),
      });
      
      console.log(`📡 ${name} authorize response status:`, res.status, res.ok);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || errorData.message || `Authentication failed (${res.status})`;
        console.error(`❌ ${name} authorization failed:`, errorData);
        throw new Error(errorMsg);
      }
      
      const data = await res.json();
      console.log(`✅ ${name} authorize successful, response keys:`, Object.keys(data));

      const candidates = (
        {
          youtube: ['youtubeURL','youtubeUrl','youtube_url'],
          linkedin: ['linkedinURL','linkedinUrl','linkedin_url'],
          reddit: ['redditURL','redditUrl','reddit_url'],
          pinterest: ['pinterestURL','pinterestUrl','pinterest_url'],
          instagram: ['instagramURL','instagramUrl','instagram_url'],
          github: ['githubURL','githubUrl','github_url'],
          facebook: ['facebookURL','facebookUrl','facebook_url'],
          gmail: ['gmailURL','gmailUrl','gmail_url'],
        }[plat.connector]
      ) || [`${plat.connector}URL`, `${plat.connector}Url`, `${plat.connector}_url`, 'platformURL', 'authUrl', 'url'];

      let oauthUrl = null; for (const k of candidates) if (data[k]) { oauthUrl = data[k]; break; }
      if (!oauthUrl) throw new Error('no url');

      const popup = window.open(oauthUrl, `${plat.connector}_oauth`, 'width=500,height=600,scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no');
      if (!popup) throw new Error('popup blocked');

      let touched = false; 
      const it = setInterval(() => {
        try { 
          if (popup.location && popup.location.hostname === 'onairos.uk') { 
            touched = true; 
            // Store platform name for callback detection
            localStorage.setItem('onairos_oauth_platform', plat.connector);
            // Don't close immediately - let callback page handle it
          } 
        } catch { 
          if (!touched) touched = true; 
        }
        try { 
          if (popup.closed) { 
            clearInterval(it); 
            setIsConnecting(false); 
            setConnectingPlatform(null);
            
            // Check if OAuth was successful via localStorage
            const oauthPlatform = localStorage.getItem('onairos_oauth_platform');
            if (oauthPlatform === plat.connector) {
              // Success - platform is already marked as connected
              localStorage.removeItem('onairos_oauth_platform');
              console.log(`✅ ${name} OAuth completed successfully`);
            } else if (touched) {
              // Popup was closed after callback, assume success
              console.log(`✅ ${name} OAuth likely completed`);
            }
          } 
        } catch {}
      }, 800);

      // Close popup after callback if still open (10 seconds after callback detected)
      setTimeout(() => { 
        try { 
          if (!popup.closed && touched) {
            popup.close(); 
          }
        } catch {} 
      }, 10000);
      
      // Final timeout after 5 minutes
      setTimeout(() => { 
        if (!popup.closed) { 
          popup.close(); 
          clearInterval(it); 
          setIsConnecting(false); 
          setConnectingPlatform(null); 
        } 
      }, 300000);
      return true;
    } catch {
      // On failure, revert the optimistic toggle
      setConnectedAccounts((s) => ({ ...s, [name]: false }));
      setIsConnecting(false); setConnectingPlatform(null); return false;
    }
  }

  const handleSwitch = async (name) => {
    if (isConnecting && connectingPlatform !== name) return;
    const on = !!connectedAccounts[name];
    if (on) setConnectedAccounts((s) => ({ ...s, [name]: false }));
    else await connectToPlatform(name);
  };

  const connectedCount = Object.values(connectedAccounts).filter(Boolean).length;

  useEffect(() => {
    if (!lottieRef.current) return;
    const totalFrames = (personaAnim.op || 0) - (personaAnim.ip || 0);
    const TOTAL_PLATFORMS = 9; // Total number of platforms across all pages
    const progress = connectedCount / TOTAL_PLATFORMS;
    const target = Math.max(0, Math.floor(progress * totalFrames));
    const start = lastFrameRef.current || 0;
    const duration = 420; const startTs = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - startTs) / duration);
      const eased = t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
      const frame = Math.floor(start + (target - start) * eased);
      lottieRef.current.goToAndStop(frame, true);
      if (t < 1) rafRef.current = requestAnimationFrame(step); else lastFrameRef.current = target;
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [connectedCount]);

  // swipe handlers for smooth paging
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; };
  const onTouchMove  = (e) => { touchDeltaX.current = e.touches[0].clientX - touchStartX.current; };
  const onTouchEnd   = () => {
    const dx = touchDeltaX.current; const THRESH = 40;
    if (dx < -THRESH && currentPage < 3) setCurrentPage(currentPage + 1);
    else if (dx > THRESH && currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="w-full h-full relative" style={{ height: Math.min('90vh', Math.max(600, Math.min(720, vh * 0.9))), minHeight: 580, maxHeight: 720 }}>
      <style>{fadeSlideInKeyframes}</style>

      {/* persona as background (unchanged) */}
      <div aria-hidden style={{ position: 'absolute', left: '50%', top: PERSONA_TOP, transform: 'translateX(-50%)', width: personaSide, height: personaSide, zIndex: 0, pointerEvents: 'none', opacity: 0.95 }}>
        <div className="overflow-hidden rounded-[28px] w-full h-full">
          <Lottie lottieRef={lottieRef} animationData={personaAnim} autoplay={false} loop={false} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* content above persona */}
      <div className="relative z-10 h-full flex flex-col">
        {/* header (unchanged visuals) */}
        <div className="px-6 pt-16 pb-4 text-center flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">Connect App Data</h1>
          <p className="text-gray-600 text-base">More Connections, Better Personalization.</p>
        </div>

        {/* Spacer to push content down */}
        <div className="flex-1" style={{ minHeight: 40 }} />

        {/* icons band */}
        <div className="px-6 flex-shrink-0" style={{ height: ICONS_H }}>
          <div className="h-full flex items-center justify-center">
            <div
              className="grid w-full box-border relative"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
                    style={{
                gridAutoFlow: 'column',
                gridTemplateColumns: `repeat(${platforms.length}, minmax(0,1fr))`,
                columnGap: currentPage === 1 ? GAP_PAGE1 : GAP_PAGE2,
                alignItems: 'center',
                justifyItems: 'center',
                paddingInline: 8,
                overflow: 'hidden',
              }}
            >
              {platforms.map((p, idx) => {
                const on = !!connectedAccounts[p.name];
                const busy = false; // keep icon static visually per request
                const isSel = selected === p.name;
                const shift = (currentPage === 1 ? idx : idx - 2) * 14;
                return (
                  <div key={p.name} className="transition-all duration-300" style={{ opacity: 0, transform: `translateX(${shift}px)`, animation: 'fadeSlideIn 0.28s forwards', ['--slide-x']: `${shift}px` }}>
                    <button
                      type="button"
                      onClick={() => { 
                        setSelected(p.name);
                        if (p.directLink) {
                          // For direct link platforms (AI tools), connect immediately and open link
                          if (!connectedAccounts[p.name]) {
                            setConnectedAccounts((s) => ({ ...s, [p.name]: true }));
                          }
                          window.open(p.directLink, '_blank');
                        } else {
                          handleSwitch(p.name);
                        }
                      }}
                      className="relative grid place-items-center outline-none"
                      style={{ width: SLOT, height: SLOT }}
                      title={p.name}
                    >
                      <div 
                        className={`rounded-full border-3 transition-all duration-150 ease-out flex items-center justify-center shadow-lg ${on ? 'border-blue-600 bg-white text-black shadow-blue-500/70' : 'border-gray-300 hover:border-gray-400 bg-white text-black'}`}
                        style={{ 
                          width: CIRCLE, 
                          height: CIRCLE, 
                          transform: `scale(${isSel ? ACTIVE_SCALE : 1})`, 
                          transformOrigin: 'center',
                          position: 'relative'
                        }}
                      >
                        {/* Glowy blue ring for connected platforms */}
                        {on && (
                          <div 
                            className="absolute inset-0 rounded-full"
                            style={{
                              boxShadow: '0 0 20px rgba(37, 99, 235, 0.6), 0 0 40px rgba(37, 99, 235, 0.4), 0 0 60px rgba(37, 99, 235, 0.2)',
                              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                              pointerEvents: 'none',
                              zIndex: -1
                            }}
                          />
                        )}
                        <div className="flex items-center justify-center relative z-10" style={{ width: 20, height: 20 }}>
                          {p.icon}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* dots navigation (no numbers) - directly under icons, above card */}
        <div className="relative flex items-center justify-center gap-4 select-none flex-shrink-0" style={{ marginTop: 20, marginBottom: 16, zIndex: 25 }}>
          {[1,2,3].map(n => (
            <button key={n} onClick={() => setCurrentPage(n)} aria-label={`page ${n}`} className="relative" style={{ width: 12, height: 12 }}>
              <span className={`block rounded-full ${currentPage === n ? 'bg-blue-600 scale-110' : 'bg-gray-300'} transition-transform`} style={{ width: 12, height: 12 }} />
            </button>
          ))}
        </div>

        {/* info sheet — positioned using flex */}
        <div className="px-6 flex-shrink-0" style={{ marginBottom: 24, zIndex: 20 }}>
          <div className="mx-auto rounded-2xl bg-white shadow-sm border border-gray-200 px-4 py-2.5" style={{ width: 'min(680px,92%)', maxHeight: vh * 0.2 }}>
            <div className="flex items-center justify-between">
              <div className="text-gray-900 font-medium">{selected}</div>
              <button
                type="button"
                role="switch"
                aria-checked={!!connectedAccounts[selected]}
                aria-label={`toggle ${selected}`}
                onClick={() => handleSwitch(selected)}
                disabled={isConnecting && connectingPlatform !== selected}
                className={`relative inline-flex items-center transition-colors disabled:opacity-50 ${connectedAccounts[selected] ? 'bg-black' : 'bg-gray-200'} rounded-full`}
                style={{ width: 56, height: 32 }}
              >
                <span className="absolute bg-white rounded-full shadow" style={{ width: 24, height: 24, transform: connectedAccounts[selected] ? 'translateX(26px)' : 'translateX(6px)', transition: 'transform 160ms ease' }} />
              </button>
            </div>
            <div className="mt-3">
              <div className="rounded-2xl bg-gray-50 text-gray-700 text-sm leading-6 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
                {descriptions[selected] || null}
              </div>
            </div>
          </div>
        </div>

        {/* Extracting chats overlay */}
        {isExtractingChats && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Extracting chats...</h3>
              <p className="text-gray-600">Please wait while we retrieve your ChatGPT conversations.</p>
            </div>
          </div>
        )}

        {/* ChatGPT helper popup inside the onboarding popup */}
        {showChatGPTHelp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div
              className="relative max-w-md w-full mx-4 p-6 rounded-3xl shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #ffffff, #ffe4f1 40%, #e0f0ff 100%)',
                border: '1px solid rgba(248, 113, 113, 0.4)',
                animation: 'modalFade 180ms ease-out',
              }}
            >
              <button
                type="button"
                onClick={() => setShowChatGPTHelp(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                aria-label="Close ChatGPT instructions"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <h3 className="text-lg font-semibold text-indigo-900 mb-1.5">Bring in your ChatGPT memories</h3>
              <p className="text-sm text-indigo-900 mb-3">
                Follow these quick steps to let Onairos extract your recent conversations:
              </p>

              <div className="mb-3">
                <div className="text-sm font-semibold text-indigo-900 mb-1.5">1 · Add the magic button</div>
                <p className="text-xs text-indigo-900 mb-2">
                  <span className="font-semibold underline">Drag this glowing button to your bookmarks bar</span>. It only runs when you
                  click it on ChatGPT.
                </p>
                <div className="flex justify-center">
                  <a
                    href={CHATGPT_BOOKMARKLET}
                    className="relative inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #fb7185, #3b82f6)',
                      boxShadow:
                        '0 0 0 0 rgba(248,113,113,0.6), 0 0 20px rgba(248,113,113,0.6), 0 0 40px rgba(59,130,246,0.5)',
                      animation: 'pulseGlow 2s ease-in-out infinite',
                    }}
                  >
                    <span className="mr-1.5 text-[10px]">✨</span>
                    Onairos ChatGPT Link
                  </a>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-sm font-semibold text-indigo-900 mb-1.5">2 · Open ChatGPT</div>
                <p className="text-xs text-indigo-900 mb-2">
                  Click the button below to open ChatGPT in a new tab. We&apos;ll stay on this window so you can follow along.
                </p>
                <div className="flex justify-center mb-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const popup = window.open('https://chatgpt.com/auth/login', '_blank');
                        if (!popup) {
                          alert('Popup blocked. Please allow popups for this site.');
                          return;
                        }
                        try { popup.blur(); } catch {}
                        try { window.focus(); } catch {}
                      } catch (e) {
                        console.error('Failed to open ChatGPT:', e);
                      }
                    }}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #fb7185)',
                      boxShadow: '0 6px 12px rgba(59,130,246,0.35)',
                    }}
                  >
                    Open ChatGPT
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-sm font-semibold text-indigo-900 mb-1.5">3 · Tap it once on ChatGPT</div>
                <p className="text-xs text-indigo-900">
                  In the ChatGPT tab, make sure you&apos;re logged in, then click the{' '}
                  <span className="font-semibold">“Onairos ChatGPT Link”</span> bookmark once. We&apos;ll receive a secure token and
                  begin extracting your chats, bringing your last <span className="font-semibold">10 conversations</span> into your
                  Onairos account.
                </p>
              </div>

              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowChatGPTHelp(false)}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #fb7185, #3b82f6)',
                    boxShadow: '0 8px 16px rgba(248,113,113,0.35)',
                  }}
                >
                  Got it, let&apos;s go
                </button>
              </div>
            </div>
          </div>
        )}

        {/* footer — anchored at bottom using flex */}
        <div className="px-6 flex-shrink-0" style={{ paddingBottom: 16, background: 'linear-gradient(to top, white 60%, rgba(255,255,255,0.9) 85%, rgba(255,255,255,0))', zIndex: 30 }}>
          <div className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-4 text-base font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors" onClick={() => {
            const connected = Object.entries(connectedAccounts).filter(([, v]) => v).map(([k]) => k);
            onComplete?.({ connectedAccounts: connected, totalConnections: connected.length });
          }}>
            Update
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
          <div onClick={() => onComplete?.({ connectedAccounts: [], totalConnections: 0 })} className="w-full text-gray-600 text-base font-medium py-2 text-center cursor-pointer hover:text-gray-800 transition-colors">Skip</div>
        </div>
      </div>
    </div>
  );
}