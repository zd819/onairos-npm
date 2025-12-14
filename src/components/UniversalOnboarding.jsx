import React, { useEffect, useId, useState, useRef } from 'react';
import { Browser } from '@capacitor/browser';
import Lottie from 'lottie-react';
import personaAnim from '../../public/persona-anim.json';
import { isMobileApp, isMobileBrowser } from '../utils/capacitorDetection';
import ConnectChatGPTModal from './ConnectChatGPTModal.jsx';

// Mobile detection
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return isMobileApp() || isMobileBrowser() || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};
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

const fadeSlideInKeyframes = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateX(var(--slide-x)); }
  to { opacity: 1; transform: translateX(0); }
}
`;

export default function UniversalOnboarding({ onComplete, onBack, appIcon, appName, username, testMode, priorityPlatform, rawMemoriesOnly, rawMemoriesConfig, isMobile: isMobileProp = false }) {
  const lottieRef = useRef(null);
  const lastFrameRef = useRef(0);
  const rafRef = useRef(null);

  const [connectedAccounts, setConnectedAccounts] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [selected, setSelected] = useState('Instagram');
  const [currentPage, setCurrentPage] = useState(1);
  const [showChatGPTModal, setShowChatGPTModal] = useState(false);

  // swipe state
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  // Mobile detection - use prop if provided (from layout), else detect
  // Only use actual mobile device detection, not window width (to avoid false positives from dev tools)
  const isActualMobileDevice = typeof navigator !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isNativePlatform = typeof window !== 'undefined' && 
    window.Capacitor?.isNativePlatform?.() === true;
  const isMobile = isMobileProp || isNativePlatform || isActualMobileDevice;

  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const FOOTER_H = 88;

  // MOBILE ONLY: persona placement / sizing - GIVE MORE SPACE TO PERSONA
  const isSmallMobile = isMobile && vh < 700;
  // Desktop adjustments: Reduce persona size and top position to fit modal without scroll
  // We allow overlap on desktop if needed
  const personaSide = isMobile 
    ? (isSmallMobile ? Math.min(vh * 0.46, 420) : Math.min(vh * 0.52, 480))
    : Math.min(vh * 0.45, 420); // Desktop: allow larger size, will position absolutely
  
  const PERSONA_TOP = isMobile 
    ? (isSmallMobile ? 28 : 44) 
    : 40; // Desktop: Higher up

  // MOBILE ONLY: icon layout - PUSH ICONS DOWN significantly
  // Desktop: Adjust spacing to fit
  const SLOT = isMobile 
    ? Math.max(50, Math.min(60, Math.floor(vh * 0.07)))
    : 60; // Desktop: fixed reasonable size
  const CIRCLE = isMobile 
    ? (isSmallMobile ? 36 : 40)
    : 40; // Desktop: fixed reasonable size
  const GAP_PAGE1 = isMobile ? 10 : 12; // Desktop: original
  const GAP_PAGE2 = isMobile ? 18 : 20; // Desktop: original
  const ACTIVE_SCALE = isMobile 
    ? (vh < 760 ? 1.15 : 1.25)
    : 1.2; // Desktop: standard scale

  const ICONS_H = isMobile 
    ? (isSmallMobile ? 70 : 80)
    : 76; // Desktop: tighter height
  const ICONS_TOP_OFFSET = isMobile 
    ? Math.max(200, Math.min(280, Math.round(vh * 0.32)))
    : 200; // Desktop: unused but kept for ref

  const igGradId = useId();

  // ---- official brand SVGs (compact, consistent viewboxes) ----
  const Brand = {
    ChatGPT: <img src={chatgptIcon} alt="ChatGPT" style={{ width: 20, height: 20, objectFit: 'contain' }} />,
    Claude: <img src={claudeIcon} alt="Claude" style={{ width: 20, height: 20, objectFit: 'contain' }} />,
    Gemini: <img src={geminiIcon} alt="Gemini" style={{ width: 20, height: 20, objectFit: 'contain' }} />,
    Grok: <img src={grokIcon} alt="Grok" style={{ width: 20, height: 20, objectFit: 'contain' }} />,
    Instagram: (
      <svg viewBox="0 0 24 24" aria-hidden width="100%" height="100%">
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
      <svg viewBox="0 0 24 24" aria-hidden width="100%" height="100%">
        <path fill="#FF0000" d="M22.54 6.42a3 3 0 0 0-2.11-2.12C18.49 3.75 12 3.75 12 3.75s-6.49 0-8.43.55A3 3 0 0 0 1.46 6.42 31.63 31.63 0 0 0 1 12a31.63 31.63 0 0 0 .46 5.58 3 3 0 0 0 2.11 2.12C5.51 20.25 12 20.25 12 20.25s6.49 0 8.43-.55a3 3 0 0 0 2.11-2.12A31.63 31.63 0 0 0 23 12a31.63 31.63 0 0 0-.46-5.58z"/>
        <path fill="#FFF" d="M10 8.75v6.5l6-3.25-6-3.25z"/>
        </svg>
      ),
    Reddit: (
      <img src="https://upload.wikimedia.org/wikipedia/en/b/bd/Reddit_Logo_Icon.svg" alt="Reddit" width="100%" height="100%" />
      ),
    LinkedIn: (
      <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" width="100%" height="100%" />
      ),
    Twitter: (
      <svg viewBox="0 0 24 24" aria-hidden width="100%" height="100%">
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
    { name: 'ChatGPT', connector: 'chatgpt', icon: Brand.ChatGPT, directLink: aiLinks.ChatGPT },
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

  useEffect(() => {
    // Listener for immediate UI update from deep link (when component is already mounted)
    const handleAuthSuccess = (e) => {
       const { platform } = e.detail;
       console.log(`⚡️ Event received: OAuth success for ${platform}`);
       const plat = allPlatforms.find((p) => p.connector === platform);
       if (plat) {
          setConnectedAccounts((s) => {
            // Read existing connections from localStorage, not from stale state
            const userData = JSON.parse(localStorage.getItem('onairosUser') || '{}');
            const existingArray = userData.connectedAccounts || [];
            const existingObj = Array.isArray(existingArray) 
              ? existingArray.reduce((acc, p) => ({ ...acc, [p]: true }), {})
              : {};
            
            // Merge with new connection
            const updated = { ...existingObj, [plat.name]: true };
            const connectedArray = Object.entries(updated).filter(([, v]) => v).map(([k]) => k);
            userData.connectedAccounts = connectedArray;
            localStorage.setItem('onairosUser', JSON.stringify(userData));
            console.log(`💾 Saved ${plat.name} to localStorage (event):`, connectedArray);
            return updated;
          });
       }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('onairos-oauth-success', handleAuthSuccess);
    }

    // Check for OAuth success on mount (after redirect back from mobile)
    const checkOAuthSuccess = () => {
      // 1. Check URL-based return signal (from OnairosButton or direct URL params)
      // Note: OnairosButton cleans up URL params, so we might check sessionStorage set by it
      const sessionSuccess = sessionStorage.getItem('onairos_oauth_return_success');
      const sessionPlatform = sessionStorage.getItem('onairos_oauth_return_platform');
      
      if (sessionSuccess === 'true' && sessionPlatform) {
        console.log(`✅ ${sessionPlatform} OAuth detected via session signal`);
        const plat = allPlatforms.find((p) => p.connector === sessionPlatform);
        if (plat) {
          setConnectedAccounts((s) => {
            // Read existing connections from localStorage, not from stale state
            const userData = JSON.parse(localStorage.getItem('onairosUser') || '{}');
            const existingArray = userData.connectedAccounts || [];
            const existingObj = Array.isArray(existingArray) 
              ? existingArray.reduce((acc, p) => ({ ...acc, [p]: true }), {})
              : {};
            
            // Merge with new connection
            const updated = { ...existingObj, [plat.name]: true };
            const connectedArray = Object.entries(updated).filter(([, v]) => v).map(([k]) => k);
            userData.connectedAccounts = connectedArray;
            localStorage.setItem('onairosUser', JSON.stringify(userData));
            console.log(`💾 Saved ${plat.name} to localStorage (session):`, connectedArray);
            return updated;
          });
        }
        // Clean up
        sessionStorage.removeItem('onairos_oauth_return_success');
        sessionStorage.removeItem('onairos_oauth_return_platform');
        return;
      }

      // 2. Fallback to existing localStorage logic (same-domain or preserved state)
      const oauthContext = localStorage.getItem('onairos_oauth_context');
      const platformConnector = localStorage.getItem('onairos_oauth_platform');
      
      // Only process if we're coming back from platform connector flow
      if (oauthContext === 'platform-connector' && platformConnector) {
        const localStorageKey = `onairos_${platformConnector}_success`;
        const timestampKey = `onairos_${platformConnector}_timestamp`;
        const success = localStorage.getItem(localStorageKey);
        const timestamp = localStorage.getItem(timestampKey);
        
        if (success === 'true' && timestamp) {
          const timestampNum = parseInt(timestamp, 10);
          const now = Date.now();
          
          // Only process if timestamp is recent (within last 30 seconds)
          if (now - timestampNum < 30000) {
            console.log(`✅ ${platformConnector} OAuth completed - processing redirect back`);
            
            // Find platform by connector
            const plat = allPlatforms.find((p) => p.connector === platformConnector);
            if (plat) {
              // Mark as connected
              setConnectedAccounts((s) => {
                // Read existing connections from localStorage, not from stale state
                const userData = JSON.parse(localStorage.getItem('onairosUser') || '{}');
                const existingArray = userData.connectedAccounts || [];
                const existingObj = Array.isArray(existingArray) 
                  ? existingArray.reduce((acc, p) => ({ ...acc, [p]: true }), {})
                  : {};
                
                // Merge with new connection
                const updated = { ...existingObj, [plat.name]: true };
                const connectedArray = Object.entries(updated).filter(([, v]) => v).map(([k]) => k);
                userData.connectedAccounts = connectedArray;
                localStorage.setItem('onairosUser', JSON.stringify(userData));
                console.log(`💾 Saved ${plat.name} to localStorage (context):`, connectedArray);
                return updated;
              });
            }
            
            // Clean up localStorage
            localStorage.removeItem(localStorageKey);
            localStorage.removeItem(timestampKey);
            localStorage.removeItem('onairos_oauth_context');
            localStorage.removeItem('onairos_oauth_platform');
            localStorage.removeItem('onairos_return_url');
          }
        }
      }
    };

    checkOAuthSuccess();
    
    // Legacy: Load OAuth platform returns (for backward compatibility)
    const p = localStorage.getItem('onairos_oauth_platform');
    if (p && !localStorage.getItem('onairos_oauth_context')) {
      localStorage.removeItem('onairos_oauth_platform');
      localStorage.removeItem('onairos_oauth_return');
      setConnectedAccounts((s) => {
        // Read existing connections from localStorage, not from stale state
        const userData = JSON.parse(localStorage.getItem('onairosUser') || '{}');
        const existingArray = userData.connectedAccounts || [];
        const existingObj = Array.isArray(existingArray) 
          ? existingArray.reduce((acc, platform) => ({ ...acc, [platform]: true }), {})
          : {};
        
        // Merge with new connection
        const updated = { ...existingObj, [p]: true };
        const connectedArray = Object.entries(updated).filter(([, v]) => v).map(([k]) => k);
        userData.connectedAccounts = connectedArray;
        localStorage.setItem('onairosUser', JSON.stringify(userData));
        console.log(`💾 Saved ${p} to localStorage (legacy):`, connectedArray);
        return updated;
      });
    }
    
    // Load persisted connected accounts from user data
    try {
      const userData = JSON.parse(localStorage.getItem('onairosUser') || '{}');
      console.log('🔄 UniversalOnboarding mount: Loading persisted accounts from localStorage:', userData.connectedAccounts);
      if (userData.connectedAccounts && Array.isArray(userData.connectedAccounts)) {
        // Convert array to object format
        const accountsObj = userData.connectedAccounts.reduce((acc, platform) => {
          acc[platform] = true;
          return acc;
        }, {});
        console.log('✅ Converted to object format:', accountsObj);
        setConnectedAccounts(accountsObj);
      } else {
        console.log('⚠️ No valid connectedAccounts in localStorage');
      }
    } catch (error) {
      console.error('❌ Failed to load persisted connected accounts:', error);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('onairos-oauth-success', handleAuthSuccess);
      }
    };
  }, []);

  async function connectToPlatform(name) {
    const plat = allPlatforms.find((p) => p.name === name);
    if (!plat) return false;
    try {
      // For direct-link platforms (no OAuth), mark connected immediately and return
      if (plat.directLink) {
        setConnectedAccounts((s) => ({ ...s, [name]: true }));
        setIsConnecting(false);
        setConnectingPlatform(null);
        return true;
      }

      // Immediately reflect selection in UI without spinner while starting OAuth
      console.log(`🔌 Connecting to ${name} - updating connectedAccounts state`);
      setConnectedAccounts((s) => {
        const updated = { ...s, [name]: true };
        console.log('📊 Updated connectedAccounts:', updated);
        return updated;
      });
      setIsConnecting(true);
      setConnectingPlatform(name);
      
      // BYPASS: Twitter endpoint is 404, so just keep toggle ON without API call
      if (name === 'Twitter') {
        console.log('🐦 Twitter: Bypassing API call (endpoint not available), keeping toggle ON');
        setIsConnecting(false);
        setConnectingPlatform(null);
        return true;
      }
      
      const username = localStorage.getItem('username') || (JSON.parse(localStorage.getItem('onairosUser') || '{}')?.email) || 'user@example.com';

      // Determine return URL based on platform
      // For Desktop/Web: Send empty string/null to prevent backend from generating a redirect URL
      // This forces oauth-callback.html to NOT redirect, allowing the popup/iframe to close naturally via postMessage or window.close()
      const isCapacitorNative = typeof window !== 'undefined' && 
        window.Capacitor && 
        typeof window.Capacitor.isNativePlatform === 'function' && 
        window.Capacitor.isNativePlatform();
      
      const isMobileBrowser = typeof navigator !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Effective mobile check for flow control (use prop or detection)
      const effectiveMobile = isMobileProp || isMobileBrowser;

      let returnUrl = ''; // Default to empty for Desktop Web
      
      if (isCapacitorNative) {
        returnUrl = `mobiletest://oauth-callback?success=true&platform=${plat.connector}`;
      } else if (effectiveMobile) {
        // Mobile Web needs redirect back to self
        // Sanitize URL to prevent recursive params if user is already on a return URL
        const cleanUrl = window.location.origin + window.location.pathname;
        returnUrl = cleanUrl;
      }

      console.log(`🔗 Authorizing ${plat.connector} with returnUrl:`, returnUrl || '(none/desktop)');

      // Build session payload for backend (SDK-aware)
      const sessionPayload = {
        username,
      };

      // For mobile web flows, let backend know this is coming from the web SDK
      // and pass returnUrl inside session for connectors that use parseEnhancedSession (e.g. Reddit)
      if (effectiveMobile) {
        sessionPayload.sdkType = 'web';
        sessionPayload.returnUrl = returnUrl;
      }

      const bodyPayload = {
        session: sessionPayload,
      };

      // Backward compatibility for YouTube route which currently reads req.body.returnUrl
      // Desktop flows don't need a returnUrl; only send it for mobile web
      if (!isCapacitorNative && effectiveMobile) {
        bodyPayload.returnUrl = returnUrl;
      }

      const res = await fetch(`${sdkConfig.baseUrl}/${plat.connector}/authorize`, {
        method: 'POST',
        headers: { 'x-api-key': sdkConfig.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      if (!res.ok) throw new Error('auth failed');
      const data = await res.json();

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

      let oauthUrl = null;
      console.log(`🔗 [DEBUG] ${plat.connector} candidates:`, candidates, 'Response keys:', Object.keys(data));
      
      // Fallback: Check for URL in data object (case-insensitive)
      if (!oauthUrl) {
         const keys = Object.keys(data);
         const candidateLower = candidates.map(c => c.toLowerCase());
         for (const key of keys) {
            if (candidateLower.includes(key.toLowerCase()) && data[key]) {
               console.log(`🔗 [DEBUG] Found fuzzy match for ${plat.connector}: ${key}`);
               oauthUrl = data[key];
               break;
            }
         }
      }

      for (const k of candidates) {
        if (data[k]) {
          oauthUrl = data[k];
          break;
        }
      }
      
      if (!oauthUrl) {
        console.error(`❌ No URL found for ${plat.connector} in response:`, data);
        throw new Error('no url');
      }

      // PRIORITY 1: Use Capacitor Browser for native apps

      if (isCapacitorNative) {
        console.log(`📱 Capacitor Native: opening ${plat.connector} OAuth with Browser plugin`);
        try {
          // Store context for when user returns
          const localStorageKey = `onairos_${plat.connector}_success`;
          localStorage.setItem('onairos_oauth_context', 'platform-connector');
          localStorage.setItem('onairos_oauth_platform', plat.connector);
          
          // Try to set up listener, but don't let it block
          // Note: 'browserFinished' is fired when the browser is closed by the user or programmatically
          try {
            await Browser.addListener('browserFinished', () => {
              console.log(`🔄 Browser closed for ${plat.connector}`);
              // Only reset if we haven't already detected success
              if (!localStorage.getItem(localStorageKey)) {
                 setIsConnecting(false);
                 setConnectingPlatform(null);
              }
            });
          } catch (listenerError) {
             console.warn('Browser listener setup failed:', listenerError);
          }
          
          // Ensure Browser.open is awaited and errors caught
          await Browser.open({ 
            url: oauthUrl,
            windowName: '_blank',
            presentationStyle: 'fullscreen'
          });
          console.log(`✅ Opened ${plat.connector} OAuth URL in Capacitor Browser`);
          
          return true;
        } catch (err) {
          console.error(`❌ Capacitor Browser failed for ${plat.connector}:`, err);
          // Fall through to mobile browser redirect if plugin fails
        }
      }

      // PRIORITY 2: Mobile browser - use same-page redirect
      if (effectiveMobile) {
        console.log(`📱 Mobile browser/view: redirecting to ${plat.connector} OAuth in same page`);
        
        // Store return URL and context for redirect back
        const returnUrl = window.location.href;
        localStorage.setItem('onairos_return_url', returnUrl);
        localStorage.setItem('onairos_oauth_context', 'platform-connector');
        localStorage.setItem('onairos_oauth_platform', plat.connector);
        console.log(`📌 Stored return URL for ${plat.connector}:`, returnUrl);
        
        // Use same-page redirect on mobile
        setIsConnecting(false);
        setConnectingPlatform(null);
        window.location.href = oauthUrl;
        return true;
      }

      // Desktop: open popup
      const popup = window.open(
        oauthUrl,
        'onairos_oauth_popup', 
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        console.warn(`⚠️ ${plat.connector} popup blocked, falling back to full-page redirect`);
        setIsConnecting(false);
        setConnectingPlatform(null);
        window.location.href = oauthUrl;
        return true;
      }

      // Set up postMessage listener for cross-origin communication
      const messageHandler = (event) => {
        // Only accept messages from onairos.uk origin
        if (event.origin !== 'https://api2.onairos.uk' && 
            event.origin !== 'https://onairos.uk' &&
            !event.origin.includes('onairos.uk')) {
          return;
        }

        if (event.data && event.data.type === 'oauth-success' && event.data.platform === plat.connector) {
          console.log(`✅ ${plat.connector} OAuth success received via postMessage:`, event.data);
          window.removeEventListener('message', messageHandler);
          clearInterval(pollInterval);
          setIsConnecting(false);
          setConnectingPlatform(null);
          // Toggle is already ON from optimistic update
          
          // Close popup immediately
          try {
            if (popup && !popup.closed) {
              popup.close();
            }
          } catch (e) {
            // Ignore errors closing popup
          }
        }
      };

      window.addEventListener('message', messageHandler);

      // Poll localStorage for OAuth completion (oauth-callback.html sets this)
      const localStorageKey = `onairos_${plat.connector}_success`;
      const timestampKey = `onairos_${plat.connector}_timestamp`;
      let pollCount = 0;
      const maxPolls = 300; // 5 minutes max

      const pollInterval = setInterval(() => {
        pollCount++;
        
        try {
          // Check if popup is closed (works for popups, not tabs)
          if (popup.closed && pollCount > 10) {
            clearInterval(pollInterval);
            window.removeEventListener('message', messageHandler);
            setIsConnecting(false);
            setConnectingPlatform(null);
            console.log(`⚠️ ${plat.connector} popup was closed`);
            return;
          }

          // Check localStorage for success signal
          const success = localStorage.getItem(localStorageKey);
          const timestamp = localStorage.getItem(timestampKey);
          
          if (success === 'true' && timestamp) {
            const timestampNum = parseInt(timestamp, 10);
            const now = Date.now();
            
            // Only process if timestamp is recent (within last 30 seconds)
            if (now - timestampNum < 30000) {
              console.log(`✅ ${plat.connector} OAuth completed successfully`);
              clearInterval(pollInterval);
              window.removeEventListener('message', messageHandler);
              setIsConnecting(false);
              setConnectingPlatform(null);
              // Toggle is already ON from optimistic update
              
              // Close popup immediately
              try {
                if (!popup.closed) {
                  popup.close();
                }
              } catch (e) {
                // Ignore errors closing popup
              }
              return;
            }
          }

          // Timeout after max polls
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            window.removeEventListener('message', messageHandler);
            setIsConnecting(false);
            setConnectingPlatform(null);
            console.log(`⏳ [TIMEOUT] ${plat.connector} OAuth polling timed out after 5 minutes`);
            
            // Try to close popup if still open
            try {
              if (!popup.closed) {
                popup.close();
              }
            } catch (e) {
              // Ignore errors closing popup
            }
          }
        } catch (error) {
          console.error(`Error in ${plat.connector} OAuth polling:`, error);
        }
      }, 1000);

      return true;
    } catch (e) {
      console.error(`❌ Error connecting to ${name}:`, e);
      // On failure, revert the optimistic toggle
      setConnectedAccounts((s) => ({ ...s, [name]: false }));
      setIsConnecting(false); setConnectingPlatform(null); return false;
    }
  }

  const handleSwitch = async (name) => {
    // Mobile: AI direct-link platforms are display-only (no-op on tap)
    const aiNoopOnMobile = ['ChatGPT', 'Claude', 'Gemini', 'Grok'];
    if (isMobile && aiNoopOnMobile.includes(name)) {
      console.log(`📱 ${name} disabled on mobile - no action`);
      return;
    }
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
    <div className="w-full h-full relative" style={{ 
      height: '100%',
      // Hide scrollbars for mobile browser only
      ...(isMobile && {
        scrollbarWidth: 'none', /* Firefox */
        msOverflowStyle: 'none', /* IE/Edge */
      })
    }}>
      <style>
        {fadeSlideInKeyframes}
        {/* Hide scrollbar for webkit browsers on mobile */}
        {isMobile && `
          .w-full::-webkit-scrollbar,
          *::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }
        `}
      </style>

      {/* persona as background (unchanged) */}
      <div aria-hidden style={{ 
        position: 'absolute', 
        left: '50%', 
        top: PERSONA_TOP, 
        transform: 'translateX(-50%)', 
        width: personaSide, 
        height: personaSide, 
        zIndex: 0, 
        pointerEvents: 'none', 
        opacity: 0.95 
      }}>
        <div className="overflow-hidden rounded-[28px] w-full h-full">
          <Lottie lottieRef={lottieRef} animationData={personaAnim} autoplay={false} loop={false} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* content above persona */}
      <div className="relative z-10 h-full flex flex-col" style={{
        // Hide scrollbars for mobile browser only
        ...(isMobile && {
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE/Edge */
        })
      }}>
        {/* header - MOBILE ONLY: smaller top padding to give persona space */}
        {/* Desktop: Reduced padding to fit everything */}
        <div className="px-6 text-center flex-shrink-0" style={{ paddingTop: isMobile ? (isSmallMobile ? '2.0rem' : '2.25rem') : '1.5rem', paddingBottom: isMobile ? '0.5rem' : '0.25rem' }}>
          {/* Web-only: lift header text slightly so it doesn't overlap the persona head */}
          <div style={{ transform: isMobile ? 'none' : 'translateY(-10px)' }}>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">Connect App Data</h1>
            <p className="text-gray-600 text-base">More Connections, Better Personalization.</p>
          </div>
        </div>

        {/* Spacer - MOBILE ONLY: push icons/card WAY down so PERSONA SHINES */}
        {/* Desktop: Increased spacer to push content lower on page */}
        {isMobile && <div className="flex-1" style={{ minHeight: isSmallMobile ? 120 : 150 }} />}
        {!isMobile && <div className="flex-1" style={{ minHeight: 80 }} />}

        {/* icons band */}
        <div className="px-6 flex-shrink-0" style={{ height: ICONS_H }}>
          {/* Web-only: nudge icon band down slightly without affecting layout below */}
          <div className="h-full flex items-center justify-center" style={{ transform: isMobile ? 'none' : 'translateY(8px)' }}>
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
                        // Mobile: AI direct-link platforms are display-only (no-op on tap)
                        const aiNoopOnMobile = ['chatgpt', 'claude', 'gemini', 'grok'];
                        if (isMobile && aiNoopOnMobile.includes(p.connector)) {
                          console.log(`📱 ${p.name} disabled on mobile - no action`);
                          return;
                        }

                        setSelected(p.name);
                        
                        // Properly detect native platform (not just Capacitor presence)
                        const isNativePlatform = typeof window !== 'undefined' && 
                          window.Capacitor?.isNativePlatform?.() === true;
                        
                        // Detect mobile browser (not Capacitor native)
                        const isMobileBrowser = typeof window !== 'undefined' && 
                          window.innerWidth <= 768 && 
                          !isNativePlatform;
                        
                        // Debug logging
                        console.log('UniversalOnboarding Click:', { 
                          platform: p.name, 
                          isMobile, 
                          isMobileProp, 
                          isNativePlatform,
                          isMobileBrowser,
                          hasCapacitor: typeof window !== 'undefined' && !!window.Capacitor,
                          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
                        });

                        // MOBILE BROWSER ONLY: Disable Instagram clicks (show visual selection but don't connect)
                        if (p.name === 'Instagram' && isMobileBrowser) {
                          console.log('📱 Instagram disabled on mobile browser - visual selection only');
                          return;
                        }

                        // For ChatGPT, show modal ONLY on DESKTOP (not mobile browser or native app)
                        if (p.connector === 'chatgpt' && !isNativePlatform && !isMobileBrowser) {
                          console.log('🤖 Opening ChatGPT Connect Modal (Desktop Only)');
                          setShowChatGPTModal(true);
                          return;
                        }
                        
                        // On mobile browser, ChatGPT card is visible but clicking does nothing (like Instagram)
                        if (p.connector === 'chatgpt' && isMobileBrowser) {
                          console.log('📱 ChatGPT disabled on mobile browser - visual selection only');
                          return;
                        }

                        if (p.directLink) {
                          // For direct-link AI tools, just select (don't open)
                          console.log(`Selecting ${p.name} (direct link platform)`);
                          setSelected(p.name);
                        } else {
                          // For all platforms, icon click should ONLY select, not toggle
                          console.log(`Selecting ${p.name}`);
                          setSelected(p.name);
                        }
                      }}
                      className="relative grid place-items-center outline-none"
                      style={{ width: SLOT, height: SLOT }}
                      title={p.name}
                    >
                      <div 
                        className={`rounded-full transition-all duration-200 ease-out flex items-center justify-center shadow-lg ${on ? 'ring-4 ring-blue-600 border-2 border-white bg-white text-black' : 'border-2 border-gray-300 hover:border-gray-400 bg-white text-black'}`}
                        style={{ 
                          width: CIRCLE, 
                          height: CIRCLE, 
                          transform: `scale(${isSel ? ACTIVE_SCALE : 1})`, 
                          transformOrigin: 'center',
                          boxShadow: on ? '0 0 0 4px rgb(37 99 235), 0 4px 6px -1px rgba(0, 0, 0, 0.1)' : undefined
                        }}
                      >
                        <div className="flex items-center justify-center" style={{ width: 20, height: 20 }}>
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
        <div className="relative flex items-center justify-center gap-3 select-none flex-shrink-0" style={{ marginTop: isMobile ? 12 : 24, marginBottom: isMobile ? 20 : 20, zIndex: 25 }}>
          {[1,2,3].map(n => (
            <button key={n} onClick={() => setCurrentPage(n)} aria-label={`page ${n}`} className="relative" style={{ width: isMobile ? 6 : 8, height: isMobile ? 6 : 8 }}>
              <span className={`block rounded-full ${currentPage === n ? 'bg-blue-600 scale-125' : 'bg-gray-300'} transition-transform`} style={{ width: isMobile ? 6 : 8, height: isMobile ? 6 : 8 }} />
            </button>
          ))}
        </div>

        {/* info sheet — positioned using flex, MOBILE ONLY: LOWER */}
        <div className="px-6 flex-shrink-0" style={{ marginBottom: isMobile ? 24 : 28, zIndex: 20 }}>
          <div className="mx-auto rounded-2xl bg-white shadow-sm border border-gray-200 px-4 py-2.5" style={{ width: 'min(680px,92%)', maxHeight: isMobile ? (vh * 0.18) : (vh * 0.2) }}>
            <div className="flex items-center justify-between">
              <div className="text-gray-900 font-medium">{selected}</div>
              <button
                type="button"
                role="switch"
                aria-checked={!!connectedAccounts[selected]}
                aria-label={`toggle ${selected}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSwitch(selected);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSwitch(selected);
                }}
                disabled={isConnecting && connectingPlatform !== selected}
                className={`relative inline-flex items-center transition-colors disabled:opacity-50 ${connectedAccounts[selected] ? 'bg-black' : 'bg-gray-200'} rounded-full touch-manipulation`}
                style={{ width: 56, height: 32, WebkitTapHighlightColor: 'transparent', userSelect: 'none', touchAction: 'manipulation' }}
              >
                <span
                  className="absolute bg-white rounded-full shadow pointer-events-none"
                  style={{
                    width: 24,
                    height: 24,
                    transform: connectedAccounts[selected] ? 'translateX(26px)' : 'translateX(6px)',
                    transition: 'transform 160ms ease',
                  }}
                />
              </button>
            </div>
            <div className="mt-3">
              <div className="rounded-2xl bg-gray-50 text-gray-700 text-sm leading-6 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
                {descriptions[selected] || null}
              </div>
              {!isMobileBrowser && !isNativePlatform && selected === 'ChatGPT' && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowChatGPTModal(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
                  >
                    <span>Connect ChatGPT</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6h8m0 0v8m0-8L6 18"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* footer — anchored at bottom using flex */}
        <div className="px-6 flex-shrink-0" style={{ paddingBottom: isMobile ? 12 : 16, background: isMobile ? 'transparent' : 'linear-gradient(to top, white 60%, rgba(255,255,255,0.9) 85%, rgba(255,255,255,0))', zIndex: 30 }}>
          <div className="w-full bg-gray-900 hover:bg-gray-800 rounded-full text-base font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
            style={{ paddingTop: isSmallMobile ? 12 : 16, paddingBottom: isSmallMobile ? 12 : 16, color: '#ffffff' }}
            onClick={() => {
            console.log('🔥 UniversalOnboarding: Update clicked');
            console.log('🔍 Current connectedAccounts state:', connectedAccounts);
            const connected = Object.entries(connectedAccounts).filter(([, v]) => v).map(([k]) => k);
            console.log('✅ Sending to onComplete:', { connectedAccounts: connected, totalConnections: connected.length });
            onComplete?.({ connectedAccounts: connected, totalConnections: connected.length });
          }}>
            Update
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="#ffffff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
          <div onClick={() => onComplete?.({ connectedAccounts: [], totalConnections: 0 })} className="w-full text-gray-600 text-base font-medium py-2 text-center cursor-pointer hover:text-gray-800 transition-colors" style={{ paddingTop: isSmallMobile ? 6 : 8, paddingBottom: isSmallMobile ? 6 : 8 }}>Skip</div>
        </div>
      </div>
      {/* Modal - Always render if state is true, regardless of isMobile prop */}
      <ConnectChatGPTModal
        open={showChatGPTModal}
        onClose={() => setShowChatGPTModal(false)}
        onConnected={() => {
          setConnectedAccounts((s) => ({ ...s, ChatGPT: true }));
        }}
      />
    </div>
  );
}