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
const pinterestIcon = 'https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png';

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

export default function UniversalOnboarding({ onComplete, onBack, appIcon, appName, username, testMode, priorityPlatform, rawMemoriesOnly, rawMemoriesConfig, isMobile: isMobileProp = false, initialConnectedAccounts = [] }) {
  const lottieRef = useRef(null);
  const lastFrameRef = useRef(0);
  const rafRef = useRef(null);
  const initialLoadDone = useRef(false);

  // Normalize platform names for initial state
  const getInitialState = () => {
    // If props provided, use them as source of truth
    if (initialConnectedAccounts && Array.isArray(initialConnectedAccounts) && initialConnectedAccounts.length > 0) {
      return initialConnectedAccounts.reduce((acc, p) => ({ 
        ...acc, 
        [p]: true 
      }), {});
    }
    // Otherwise fallback to empty (will check localStorage in useEffect)
    return {};
  };

  const [connectedAccounts, setConnectedAccounts] = useState(getInitialState);
  // Track which platforms were connected BEFORE this session started (for cache invalidation)
  const initialPlatformsRef = useRef(new Set(
    initialConnectedAccounts && Array.isArray(initialConnectedAccounts) 
      ? initialConnectedAccounts 
      : []
  ));
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [selected, setSelected] = useState('Instagram');
  const [currentPage, setCurrentPage] = useState(1);
  const [showChatGPTModal, setShowChatGPTModal] = useState(false);

  // Sync with initialConnectedAccounts prop changes (e.g. navigation back/forth)
  // This useEffect must be AFTER the platform definitions so it can canonicalize names
  // It's defined here but will run after component setup

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

  // Cap the info card height so the bottom stack (icons + card + Continue)
  // can stay anchored to the bottom without introducing scrollbars.
  const INFO_SHEET_MAX_H = isMobile ? (vh * 0.18) : Math.min(200, Math.round(vh * 0.22));

  const FOOTER_H = 88;

  // MOBILE ONLY: persona placement / sizing - GIVE MORE SPACE TO PERSONA
  const isSmallMobile = isMobile && vh < 700;
  // Desktop adjustments: Reduce persona size and top position to fit modal without scroll
  // We allow overlap on desktop if needed
  const personaSide = isMobile 
    ? (isSmallMobile ? Math.min(vh * 0.42, 380) : Math.min(vh * 0.45, 420))
    : Math.min(vh * 0.45, 420); // Desktop: allow larger size, will position absolutely
  
  // Adjusted to prevent text overlap
  const PERSONA_TOP = isMobile 
    ? (isSmallMobile ? 70 : 90) 
    : 80; // Desktop: raised up higher to sit behind header/text (z-index 0)

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
    : 64; // Desktop: tighter height to avoid overflow/scroll
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
    Pinterest: (
      <img src={pinterestIcon} alt="Pinterest" width="100%" height="100%" />
      ),
    Twitter: (
      <svg viewBox="0 0 24 24" aria-hidden width="100%" height="100%">
        <path fill="#000000" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      ),
    X: (
      <svg viewBox="0 0 24 24" aria-hidden width="100%" height="100%">
        <path fill="#000000" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
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
    X: <>We observe your <strong className="font-semibold">likes</strong> and <strong className="font-semibold">bookmarks</strong> to understand your interests and preferences.</>,
    YouTube: <>We study your <strong className="font-semibold">watch history</strong> and <strong className="font-semibold">interactions</strong> to learn your interests.</>,
    Reddit: <>We examine your <strong className="font-semibold">search history</strong> and <strong className="font-semibold">discussions</strong> to understand your interests.</>,
    Instagram: <>We analyze your <strong className="font-semibold">photos</strong> and <strong className="font-semibold">interactions</strong> to learn visual preferences.</>,
    LinkedIn: <>We study your <strong className="font-semibold">professional graph</strong> and <strong className="font-semibold">content</strong> to understand career interests.</>,
    Pinterest: <>We analyze your <strong className="font-semibold">boards</strong> and <strong className="font-semibold">pins</strong> to understand your creative interests and style.</>,
  };

  // Full platform list for all apps
  const allPlatformsDefault = [
    // Page 1
    { name: 'Instagram', connector: 'instagram', icon: Brand.Instagram },
    { name: 'YouTube', connector: 'youtube', icon: Brand.YouTube },
    { name: 'ChatGPT', connector: 'chatgpt', icon: Brand.ChatGPT, directLink: aiLinks.ChatGPT },
    // Page 2
    { name: 'Claude', connector: 'claude', icon: Brand.Claude, directLink: aiLinks.Claude },
    { name: 'Gemini', connector: 'gemini', icon: Brand.Gemini, directLink: aiLinks.Gemini },
    { name: 'X', connector: 'x', icon: Brand.X, description: descriptions.X }, // Twitter is now X
    // Page 3
    { name: 'LinkedIn', connector: 'linkedin', icon: Brand.LinkedIn },
    { name: 'Reddit', connector: 'reddit', icon: Brand.Reddit },
    { name: 'Grok', connector: 'grok', icon: Brand.Grok, directLink: aiLinks.Grok },
  ];

  // Restricted platform list for onairos-wrapped only
  const wrappedPlatforms = [
    { name: 'YouTube', connector: 'youtube', icon: Brand.YouTube },
    { name: 'Pinterest', connector: 'pinterest', icon: Brand.Pinterest },
    { name: 'Reddit', connector: 'reddit', icon: Brand.Reddit },
    { name: 'X', connector: 'x', icon: Brand.X },
  ];

    const isWrappedApp = typeof appName === 'string' && appName.toLowerCase().includes('onairos-wrapped');
  
  const allPlatforms = isWrappedApp ? wrappedPlatforms : allPlatformsDefault;

  // Normalize platform strings coming from various sources (connector ids like "linkedin"
  // vs display names like "LinkedIn") so connected rings render reliably.
  const canonicalizePlatformName = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const lower = raw.toLowerCase();
    
    // Handle Twitter/X aliasing (twitter and x are the same platform)
    if (lower === 'twitter') {
      return 'X';
    }
    
    const byConnector = allPlatforms.find((p) => String(p.connector).toLowerCase() === lower);
    if (byConnector) return byConnector.name;
    const byName = allPlatforms.find((p) => String(p.name).toLowerCase() === lower);
    if (byName) return byName.name;
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  // Helper to notify DataRequest when connected accounts change
  const notifyConnectedAccountsUpdate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('onairos-connected-accounts-update'));
    }
  };

  // Sync with initialConnectedAccounts prop changes (e.g. navigation back/forth)
  // This MUST be after canonicalizePlatformName is defined
  useEffect(() => {
    if (initialConnectedAccounts && Array.isArray(initialConnectedAccounts) && initialConnectedAccounts.length > 0) {
      setConnectedAccounts((prev) => {
        // Create map from props - MUST canonicalize platform names to match local state format
        const propState = initialConnectedAccounts.reduce((acc, p) => {
          const canonical = canonicalizePlatformName(p);
          if (canonical) {
            acc[canonical] = true;
          }
          return acc;
        }, {});
        console.log('🔄 Syncing connected accounts from props:', propState);
        // Merge with current state (preserving local toggles if any, but ensuring props are respected)
        // If the user just navigated back, propState is the source of truth for already-connected accounts
        const merged = { ...prev, ...propState };
        return merged;
      });
    }
  }, [initialConnectedAccounts]);

  // Debug: Log connectedAccounts state changes
  useEffect(() => {
    console.log('🔄 connectedAccounts state changed:', connectedAccounts);
  }, [connectedAccounts]);

  // Auto-persist connected accounts to localStorage whenever they change
  useEffect(() => {
    console.log('💾 Persistence useEffect triggered. connectedAccounts:', connectedAccounts, 'length:', Object.keys(connectedAccounts).length);
    
    // Skip initial mount if connectedAccounts is empty
    if (Object.keys(connectedAccounts).length === 0) {
      console.log('⏭️ Skipping persistence (empty state)');
      return;
    }
    
    try {
      const userData = JSON.parse(localStorage.getItem('onairosUser') || '{}');
      const connectedArray = Object.entries(connectedAccounts)
        .filter(([, v]) => !!v)
        .map(([k]) => canonicalizePlatformName(k))
        .filter(Boolean);
      userData.connectedAccounts = connectedArray;
      localStorage.setItem('onairosUser', JSON.stringify(userData));
      console.log('✅ Auto-persisted connected accounts:', connectedArray);
      notifyConnectedAccountsUpdate();
    } catch (e) {
      console.error('❌ Error auto-persisting connected accounts:', e);
    }
  }, [connectedAccounts]);

  const getPlatformsForPage = (page) => {
    // If wrapped app, show all platforms on one page (no pagination)
    if (isWrappedApp) return allPlatforms;
    
    // For other apps, use pagination
    if (page === 1) return allPlatforms.slice(0, 3);
    if (page === 2) return allPlatforms.slice(3, 6);
    return allPlatforms.slice(6);
  };

  const platforms = getPlatformsForPage(currentPage);

  // Wrapped-only: ensure we never show a default selection that isn't available (e.g. Instagram),
  // and keep paging locked to a single page.
  useEffect(() => {
    if (!isWrappedApp) return;
    if (currentPage !== 1) setCurrentPage(1);
    const allowed = new Set(wrappedPlatforms.map((p) => p.name));
    if (!allowed.has(selected)) {
      // For wrapped apps, set a valid default selection if current one is invalid
      // Do NOT set connectedAccounts state here, just the UI selection
      setSelected('YouTube');
    }
  }, [isWrappedApp, currentPage, selected]);

  useEffect(() => {
    // Listener for immediate UI update from deep link (when component is already mounted)
    const handleAuthSuccess = (e) => {
       const { platform } = e.detail;
       console.log(`⚡️ Event received: OAuth success for ${platform}`);
       const plat = allPlatforms.find((p) => p.connector === platform);
       if (plat) {
          // Mark that we just processed OAuth (for 5 seconds)
          sessionStorage.setItem('onairos_just_connected', Date.now().toString());
          // Update state (persistence happens automatically via useEffect)
          setConnectedAccounts((currentState) => {
            const updated = { ...currentState, [plat.name]: true };
            console.log(`✅ Connected ${plat.name} (event) - adding to:`, currentState, '→ result:', updated);
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
          // Mark that we just processed OAuth (for 5 seconds)
          sessionStorage.setItem('onairos_just_connected', Date.now().toString());
          // Update state (persistence happens automatically via useEffect)
          setConnectedAccounts((currentState) => {
            const updated = { ...currentState, [plat.name]: true };
            console.log(`✅ Connected ${plat.name} (session) - adding to:`, currentState, '→ result:', updated);
            return updated;
          });
        }
        // Clean up
        sessionStorage.removeItem('onairos_oauth_return_success');
        sessionStorage.removeItem('onairos_oauth_return_platform');
        return true; // Signal that OAuth was processed
      }
      return false;

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
              // Mark that we just processed OAuth (for 5 seconds)
              sessionStorage.setItem('onairos_just_connected', Date.now().toString());
              // Update state (persistence happens automatically via useEffect)
              setConnectedAccounts((currentState) => {
                const updated = { ...currentState, [plat.name]: true };
                console.log(`✅ Connected ${plat.name} (context) - adding to:`, currentState, '→ result:', updated);
                return updated;
              });
            }
            
            // Clean up localStorage
            localStorage.removeItem(localStorageKey);
            localStorage.removeItem(timestampKey);
            localStorage.removeItem('onairos_oauth_context');
            localStorage.removeItem('onairos_oauth_platform');
            localStorage.removeItem('onairos_return_url');
            return true; // Signal that OAuth was processed
          }
        }
      }
      return false;
    };

    // Check if we're in the middle of an OAuth flow (within last 2 seconds)
    const justConnectedTime = sessionStorage.getItem('onairos_just_connected');
    const inOAuthFlow = justConnectedTime && (Date.now() - parseInt(justConnectedTime, 10) < 2000);
    
    // ALWAYS load from localStorage on mount UNLESS we're actively processing OAuth right now
    // (to avoid overwriting the OAuth update that just happened)
    if (!inOAuthFlow) {
    try {
      const userData = JSON.parse(localStorage.getItem('onairosUser') || '{}');
      console.log('🔄 UniversalOnboarding mount: Loading persisted accounts from localStorage:', userData.connectedAccounts);
      if (userData.connectedAccounts && Array.isArray(userData.connectedAccounts)) {
        // Convert array to object format
        const accountsObj = userData.connectedAccounts.reduce((acc, platform) => {
            acc[canonicalizePlatformName(platform)] = true;
          return acc;
        }, {});
          console.log('✅ Loaded connected accounts:', accountsObj);
        setConnectedAccounts(accountsObj);
      } else {
        console.log('⚠️ No valid connectedAccounts in localStorage');
        // CRITICAL FIX: Ensure no auto-toggles for new users.
        // If localStorage is empty, we default to empty state.
        setConnectedAccounts({});
      }
    } catch (error) {
      console.error('❌ Failed to load persisted connected accounts:', error);
      }
    } else {
      console.log('⏭️ Skipping localStorage load (OAuth just completed)');
    }
    
    initialLoadDone.current = true;
    
    // THEN: Check for OAuth success (which will ADD to existing connections)
    checkOAuthSuccess();
    
    // Legacy: Load OAuth platform returns (for backward compatibility)
    const p = localStorage.getItem('onairos_oauth_platform');
    if (p && !localStorage.getItem('onairos_oauth_context')) {
      // Only accept legacy signals if there is a *real* recent success marker.
      // Otherwise this can auto-toggle a platform for "new users" from stale leftovers.
      const legacySuccess = localStorage.getItem(`onairos_${String(p).toLowerCase()}_success`) || localStorage.getItem(`onairos_${p}_success`);
      const legacyTs = localStorage.getItem(`onairos_${String(p).toLowerCase()}_timestamp`) || localStorage.getItem(`onairos_${p}_timestamp`);
      const legacyTsNum = legacyTs ? parseInt(legacyTs, 10) : NaN;
      const legacyOk = legacySuccess === 'true' && Number.isFinite(legacyTsNum) && (Date.now() - legacyTsNum < 30000);

      if (!legacyOk) {
        // Clean up stale keys and do nothing.
        localStorage.removeItem('onairos_oauth_platform');
        localStorage.removeItem('onairos_oauth_return');
      } else {
        localStorage.removeItem('onairos_oauth_platform');
        localStorage.removeItem('onairos_oauth_return');
        
        // Mark that we just processed OAuth (for 5 seconds)
        sessionStorage.setItem('onairos_just_connected', Date.now().toString());
        // Update state (persistence happens automatically via useEffect)
        const canonical = canonicalizePlatformName(p);
        setConnectedAccounts((currentState) => {
          const updated = { ...currentState, [canonical]: true };
          console.log(`✅ Connected ${canonical} (legacy) - adding to:`, currentState);
          return updated;
        });
      }
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

      // IMPORTANT: do NOT optimistically mark as connected before OAuth completes.
      // Otherwise users can hit "Update" and persist a fake connection.
      console.log(`🔌 Connecting to ${name} - starting OAuth (no optimistic connected state)`);
      setIsConnecting(true);
      setConnectingPlatform(name);
      
      // BYPASS: Twitter endpoint is 404, so just keep toggle ON without API call
      if (name === 'Twitter') {
        console.log('🐦 Twitter: Bypassing API call (endpoint not available), keeping toggle ON');
        setIsConnecting(false);
        setConnectingPlatform(null);
        return true;
      }
      
      // IMPORTANT: Backend connectors (notably Reddit) validate the Onairos account by username/email.
      // If we accidentally send the fallback 'user@example.com', the backend will respond with
      // `oauth-callback.html?success=false&error=Account%20Doesn%27t%20Exist` even when the user exists.
      //
      // Prefer the prop `username` passed from `onairosButton.jsx` (derived from the verified session),
      // then fall back to stored values. Avoid hardcoded placeholder emails.
      const resolvedUsername =
        (typeof username === 'string' && username.trim().length > 0 ? username.trim() : '') ||
        (typeof localStorage !== 'undefined' ? (localStorage.getItem('username') || '') : '') ||
        (() => {
          try {
            const u = JSON.parse(localStorage.getItem('onairosUser') || '{}');
            return u?.email || u?.username || '';
          } catch {
            return '';
          }
        })();

      if (!resolvedUsername) {
        console.warn('⚠️ No username/email available for OAuth authorize payload; aborting connect to avoid backend Account Does Not Exist.');
        throw new Error('missing username');
      }

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
      const sessionPayload = { username: resolvedUsername };

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
          x: ['xURL','xUrl','x_url','twitterURL','twitterUrl','twitter_url'],
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

      // Mobile-only: ensure the OAuth URL can always bring us back to the app even on failure.
      // On mobile Safari/Chrome the OAuth flow often runs in a full tab (no window.opener) and
      // window.close() is blocked. Our `public/oauth-callback.html` will redirect back if it can
      // resolve `returnUrl` (query param) or decode it from `state`.
      const withMobileReturnUrl = (rawUrl) => {
        if (!rawUrl || typeof window === 'undefined') return rawUrl;
        try {
          const u = new URL(rawUrl);
          const cleanReturnUrl = `${window.location.origin}${window.location.pathname}`;
          // Put returnUrl directly on callback URL if we're already pointing at oauth-callback.html
          if ((u.pathname || '').includes('oauth-callback.html') && !u.searchParams.get('returnUrl')) {
            u.searchParams.set('returnUrl', cleanReturnUrl);
          }
          // Also embed returnUrl into OAuth state so the provider echoes it back to the callback.
          // (Many backends don't propagate returnUrl on early errors; state keeps it round-trippable.)
          if (!u.searchParams.get('state')) {
            const statePayload = { returnUrl: cleanReturnUrl, platform: plat.connector, ts: Date.now() };
            const encoded = btoa(JSON.stringify(statePayload));
            u.searchParams.set('state', encoded);
          }
          return u.toString();
        } catch (_) {
          // Fallback for non-URL strings: best-effort append returnUrl when callback is already in the URL
          try {
            const cleanReturnUrl = `${window.location.origin}${window.location.pathname}`;
            if (String(rawUrl).includes('oauth-callback.html') && !String(rawUrl).includes('returnUrl=')) {
              const sep = String(rawUrl).includes('?') ? '&' : '?';
              return `${rawUrl}${sep}returnUrl=${encodeURIComponent(cleanReturnUrl)}`;
            }
          } catch (_) {}
          return rawUrl;
        }
      };

      // Always store a return URL/context before launching OAuth.
      // On iOS Safari, "popup" often becomes a new tab with no window.opener,
      // so oauth-callback must rely on localStorage to navigate back.
      try {
        // Hint to the SDK: after OAuth completes, reopen the modal on UniversalOnboarding
        // (otherwise existing users can get auto-routed to DataRequest on reload).
        localStorage.setItem('onairos_post_oauth_flow', 'onboarding');
        const returnUrl = window.location.href;
        localStorage.setItem('onairos_return_url', returnUrl);
        localStorage.setItem('onairos_oauth_context', 'platform-connector');
        localStorage.setItem('onairos_oauth_platform', plat.connector);
        console.log(`📌 Stored return URL for ${plat.connector}:`, returnUrl);
      } catch (e) {
        // ignore storage failures
      }

      // PRIORITY 1: Use Capacitor Browser for native apps

      if (isCapacitorNative) {
        console.log(`📱 Capacitor Native: opening ${plat.connector} OAuth with Browser plugin`);
        try {
          // Store context for when user returns
          const localStorageKey = `onairos_${plat.connector}_success`;
          
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
        localStorage.setItem('onairos_post_oauth_flow', 'onboarding');
        localStorage.setItem('onairos_return_url', returnUrl);
        localStorage.setItem('onairos_oauth_context', 'platform-connector');
        localStorage.setItem('onairos_oauth_platform', plat.connector);
        console.log(`📌 Stored return URL for ${plat.connector}:`, returnUrl);
        
        // Use same-page redirect on mobile (ensure oauthUrl carries returnUrl/state so callback can redirect back)
        setIsConnecting(false);
        setConnectingPlatform(null);
        window.location.href = withMobileReturnUrl(oauthUrl);
        return true;
      }

      // Desktop: open popup
      // Note: User requested "popup iframes". Standard OAuth uses window.open (popup window).
      // Iframes are typically blocked by providers (X-Frame-Options: DENY).
      // We ensure it opens as a popup and we monitor it.
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        oauthUrl,
        'onairos_oauth_popup', 
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
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
        // Allow localhost for dev testing as well
        const allowedOrigins = ['https://api2.onairos.uk', 'https://onairos.uk'];
        const isAllowed = allowedOrigins.includes(event.origin) || 
                          event.origin.includes('onairos.uk') || 
                          event.origin.includes('localhost') || 
                          event.origin.includes('127.0.0.1');
        
        if (!isAllowed) {
          console.log(`⚠️ Ignoring postMessage from unknown origin: ${event.origin}`);
          return;
        }

        if (event.data && event.data.type === 'oauth-success' && (event.data.platform === plat.connector || event.data.platform === name)) {
          console.log(`✅ ${plat.connector} OAuth success received via postMessage:`, event.data);
          window.removeEventListener('message', messageHandler);
          clearInterval(pollInterval);
          setIsConnecting(false);
          setConnectingPlatform(null);
          
          // Mark connected ONLY after actual OAuth success (persistence happens automatically via useEffect)
          setConnectedAccounts((currentState) => {
            const updated = { ...currentState, [plat.name]: true };
            console.log(`✅ Connected ${plat.name} (postMessage) - Current:`, currentState, '→ Updated:', updated);
            return updated;
          });

          // Clean up any OAuth markers so they can't incorrectly affect future sessions.
          try {
            localStorage.removeItem(localStorageKey);
            localStorage.removeItem(timestampKey);
            localStorage.removeItem('onairos_oauth_context');
            localStorage.removeItem('onairos_oauth_platform');
            localStorage.removeItem('onairos_return_url');
          } catch (e) {}
          
          // Close popup immediately
          try {
            if (popup && !popup.closed) {
              popup.close();
              console.log('🚪 Closed popup via postMessage handler');
            }
          } catch (e) {
            // Ignore errors closing popup
          }
        } else if (event.data && event.data.type === 'oauth-failure' && (event.data.platform === plat.connector || event.data.platform === name)) {
            console.warn(`❌ ${plat.connector} OAuth failure received via postMessage:`, event.data);
            window.removeEventListener('message', messageHandler);
            clearInterval(pollInterval);
            
            // Revert state
            setIsConnecting(false);
            setConnectingPlatform(null);
            setConnectedAccounts((s) => ({ ...s, [plat.name]: false }));
            
             // Clean up
             try {
                localStorage.removeItem(localStorageKey);
                localStorage.removeItem(timestampKey);
                localStorage.removeItem('onairos_oauth_context');
                localStorage.removeItem('onairos_oauth_platform');
                localStorage.removeItem('onairos_return_url');
             } catch(e) {}

             // Close popup
             try {
                if (popup && !popup.closed) {
                   popup.close();
                }
             } catch(e) {}
        }
      };

      window.addEventListener('message', messageHandler);

      // Poll localStorage for OAuth completion (oauth-callback.html sets this)
      // Note: Only works if same-origin or shared storage strategies are used.
      // For cross-origin (app on onairos.uk vs api2.onairos.uk), this relies on postMessage or redirect.
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
          const errorSignal = localStorage.getItem(`onairos_${plat.connector}_error`);
          
          if (errorSignal) {
             console.warn(`❌ ${plat.connector} error signal detected in localStorage`);
             clearInterval(pollInterval);
             window.removeEventListener('message', messageHandler);
             
             // Revert state
             setIsConnecting(false);
             setConnectingPlatform(null);
             setConnectedAccounts((s) => ({ ...s, [plat.name]: false }));
             
             // Cleanup
             try {
                localStorage.removeItem(`onairos_${plat.connector}_error`);
                localStorage.removeItem(localStorageKey);
                localStorage.removeItem(timestampKey);
                localStorage.removeItem('onairos_oauth_context');
                localStorage.removeItem('onairos_oauth_platform');
                localStorage.removeItem('onairos_return_url');
             } catch(e) {}
             
             // Close popup
             try {
                if (!popup.closed) popup.close();
             } catch(e) {}
             return;
          }
          
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
              
              // Mark connected ONLY after actual OAuth success (persistence happens automatically via useEffect)
              setConnectedAccounts((currentState) => {
                const updated = { ...currentState, [plat.name]: true };
                console.log(`✅ Connected ${plat.name} (localStorage poll) - adding to:`, currentState, '→ result:', updated);
                return updated;
              });

              // Clean up success markers + oauth context so they don't cause auto-toggles later.
              try {
                localStorage.removeItem(localStorageKey);
                localStorage.removeItem(timestampKey);
                localStorage.removeItem('onairos_oauth_context');
                localStorage.removeItem('onairos_oauth_platform');
                localStorage.removeItem('onairos_return_url');
              } catch (e) {}
              
              // Close popup immediately
              try {
                if (!popup.closed) {
                  popup.close();
                  console.log('🚪 Closed popup via localStorage polling');
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
    if (on) {
      // Toggle OFF - disconnect from backend AND local state
      setConnectedAccounts((currentState) => {
        const updated = { ...currentState, [name]: false };
        console.log(`🔴 Disconnected ${name}`);
        return updated;
      });
      
      // Call backend /revoke to actually remove the connection from database
      // This ensures wrapped dashboard signature changes and forces regeneration
      try {
        const baseUrl = (typeof window !== 'undefined' && window.onairosBaseUrl) || 'https://api2.onairos.uk';
        const userToken = localStorage.getItem('onairos_user_token');
        const savedUser = JSON.parse(localStorage.getItem('onairosUser') || '{}');
        const userIdentifier = username || savedUser.username || savedUser.email || '';
        
        if (!userIdentifier) {
          console.warn(`⚠️ Cannot revoke ${name} - no user identifier found`);
          return;
        }
        
        console.log(`🔴 Calling backend /revoke for ${name}...`);
        const revokeResponse = await fetch(`${baseUrl}/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(userToken && { 'Authorization': `Bearer ${userToken}` })
          },
          body: JSON.stringify({
            Info: {
              connection: name,
              username: userIdentifier
            }
          })
        });
        console.log(`✅ Backend revoke successful for ${name}`);
        
        // CRITICAL FIX: Invalidate cached dashboard after disconnect
        // The backend should do this automatically, but we force it here as a workaround
        // for the bug where /revoke doesn't invalidate the dashboard cache
        if (revokeResponse.ok) {
          console.log(`🗑️ Invalidating cached dashboard for ${userIdentifier}...`);
          try {
            await fetch(`${baseUrl}/invalidate-dashboard-cache`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(userToken && { 'Authorization': `Bearer ${userToken}` })
              },
              body: JSON.stringify({
                username: userIdentifier,
                reason: `Disconnected ${name}`
              })
            });
            console.log(`✅ Dashboard cache invalidated for ${userIdentifier}`);
          } catch (cacheError) {
            console.warn(`⚠️ Failed to invalidate dashboard cache (non-critical):`, cacheError);
          }
        }
      } catch (revokeError) {
        console.warn(`⚠️ Backend revoke failed for ${name}:`, revokeError);
        // Don't block UI - disconnection still works locally
      }
      
      return;
    }
    else await connectToPlatform(name);
  };

  const connectedCount = Object.values(connectedAccounts).filter(Boolean).length;

  useEffect(() => {
    if (!lottieRef.current) return;
    const totalFrames = (personaAnim.op || 0) - (personaAnim.ip || 0);
    const TOTAL_PLATFORMS = isWrappedApp ? 4 : 9; // 4 for wrapped app (YouTube, Pinterest, Reddit, X), 9 for other apps
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
    // Disable pagination swipe for wrapped app
    if (!isWrappedApp) {
    if (dx < -THRESH && currentPage < 3) setCurrentPage(currentPage + 1);
    else if (dx > THRESH && currentPage > 1) setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="w-full h-full relative" style={{ 
      // CRITICAL: Ensure this screen stretches to the available modal height on desktop.
      // Relying on `height: 100%` can fail when ancestors don't have an explicit height,
      // which makes the CTA appear to "float" instead of sitting on the bottom.
      flex: 1,
      minHeight: 0,
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
      <div
        className="relative z-10 h-full flex flex-col"
        style={{
        minHeight: 0,
        overflow: 'hidden',
        }}
      >
        {/* header - MOVED TO TOP Z-INDEX to sit above persona if overlapped */}
        {/* Desktop: Reduced padding to fit everything */}
        <div
          className="px-6 text-center flex-shrink-0 relative z-20"
          style={{
            paddingTop: isMobile ? (isSmallMobile ? '2.5rem' : '3rem') : '1.5rem',
            paddingBottom: isMobile ? '0.5rem' : '0.25rem',
          }}
        >
          {/* Nudge header/subheader up slightly on mobile without affecting layout below (transform doesn't affect flow). */}
          <div style={{ transform: isMobile ? 'translateY(-6px)' : 'translateY(0px)' }}>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight" style={{ fontFamily: 'IBM Plex Sans, system-ui, sans-serif' }}>
              Connect App Data
            </h1>
            <p className="text-gray-600 text-base" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              More Connections, Better Personalization.
            </p>
          </div>
        </div>

        {/* Spacer - MOBILE ONLY: push icons/card WAY down so PERSONA SHINES */}
        {/* Desktop: Push content to bottom of modal */}
        {isMobile && <div className="flex-1" style={{ minHeight: isSmallMobile ? 80 : 100 }} />}
        {!isMobile && <div className="flex-1" />}

        {/* icons band */}
        <div className="px-6 flex-shrink-0" style={{ height: ICONS_H }}>
          {/* Web-only: nudge icon band down slightly without affecting layout below */}
          <div className="h-full flex items-center justify-center" style={{ transform: isMobile ? 'none' : 'translateY(0px)' }}>
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
                const showConnectedStyling = on;
                const busy = false; // keep icon static visually per request
                const isSel = selected === p.name;
                
                // Debug: Log connection state for each platform
                if (on) {
                  console.log(`🔵 ${p.name} is connected:`, { on, showConnectedStyling, connectedAccounts });
                }
                const shift = (currentPage === 1 ? idx : idx - 2) * 14;
                return (
                  <div key={p.name} className="transition-all duration-300" style={{ opacity: 0, transform: `translateX(${shift}px)`, animation: 'fadeSlideIn 0.28s forwards', ['--slide-x']: `${shift}px` }}>
                    <button
                      type="button"
                      onClick={() => { 
                        // Mobile: AI direct-link platforms are display-only (no-op on tap)
                        const aiNoopOnMobile = ['claude', 'gemini', 'grok'];
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

                        // For ChatGPT, show modal on both Desktop and Mobile Browser (since we have a mobile flow now)
                        if (p.connector === 'chatgpt' && !isNativePlatform) {
                          console.log('🤖 Opening ChatGPT Connect Modal');
                          setShowChatGPTModal(true);
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
                        className={`rounded-full transition-all duration-200 ease-out flex items-center justify-center shadow-lg ${showConnectedStyling ? 'ring-4 ring-blue-600 border-2 border-white bg-white text-black' : 'border-2 border-gray-300 hover:border-gray-400 bg-white text-black'}`}
                        style={{ 
                          width: CIRCLE, 
                          height: CIRCLE, 
                          transform: `scale(${isSel ? ACTIVE_SCALE : 1})`, 
                          transformOrigin: 'center',
                          boxShadow: showConnectedStyling ? '0 0 0 4px rgb(37 99 235), 0 4px 6px -1px rgba(0, 0, 0, 0.1)' : undefined
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

        {/* Pagination dots - hidden for wrapped app */}
        {!isWrappedApp && (
        <div className="relative flex items-center justify-center gap-3 select-none flex-shrink-0" style={{ marginTop: isMobile ? 12 : 10, marginBottom: isMobile ? 20 : 10, zIndex: 25 }}>
          {[1,2,3].map(n => (
            <button key={n} onClick={() => setCurrentPage(n)} aria-label={`page ${n}`} className="relative" style={{ width: isMobile ? 6 : 8, height: isMobile ? 6 : 8 }}>
              <span className={`block rounded-full ${currentPage === n ? 'bg-blue-600 scale-125' : 'bg-gray-300'} transition-transform`} style={{ width: isMobile ? 6 : 8, height: isMobile ? 6 : 8 }} />
            </button>
          ))}
        </div>
        )}

        {/* info sheet — positioned using flex */}
        <div className="px-6 flex-shrink-0" style={{ marginBottom: isMobile ? 24 : 12, zIndex: 20 }}>
          <div
            className="mx-auto rounded-2xl bg-white shadow-sm border border-gray-200 px-4 py-2.5"
            style={{ 
              width: 'min(680px,92%)', 
              maxHeight: INFO_SHEET_MAX_H,
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-gray-900 font-medium" style={{ fontFamily: 'IBM Plex Sans, system-ui, sans-serif' }}>{selected}</div>
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
            {/* Description text - Gray box removed, text kept */}
            <div className={`mt-3 ${isMobile ? 'text-sm leading-6' : 'text-xs leading-5'} text-gray-700 px-1`}>
               {descriptions[selected] || null}
            </div>
            <div className="mt-3">
              {!isMobileBrowser && !isNativePlatform && selected === 'ChatGPT' && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowChatGPTModal(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
                  >
                    <span style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Connect ChatGPT</span>
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

        {/* footer — anchored at bottom (CTA always pinned; content above scrolls) */}
        <div
          className="px-6 flex-shrink-0"
          style={{
            position: 'sticky',
            bottom: 0,
            marginTop: 'auto',
            paddingBottom: isMobile ? 12 : 18,
            paddingTop: 10,
            background: isMobile ? 'transparent' : 'linear-gradient(to top, white 60%, rgba(255,255,255,0.9) 85%, rgba(255,255,255,0))',
            zIndex: 30,
          }}
        >
          {(() => {
            const connected = Object.entries(connectedAccounts).filter(([, v]) => v).map(([k]) => k);
            const hasConnections = connected.length > 0;
            
            return (
              <div 
                className={`w-full rounded-full text-base font-medium flex items-center justify-center gap-2 transition-colors ${
                  hasConnections 
                    ? 'bg-gray-900 hover:bg-gray-800 cursor-pointer' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
                style={{ 
                  fontFamily: 'Inter, system-ui, sans-serif',
                  paddingTop: isMobile ? (isSmallMobile ? 12 : 16) : 14,
                  paddingBottom: isMobile ? (isSmallMobile ? 12 : 16) : 14,
                  color: hasConnections ? '#ffffff' : '#9CA3AF',
                  opacity: hasConnections ? 1 : 0.6
                }}
                onClick={() => {
                  if (!hasConnections) {
                    console.log('⚠️ UniversalOnboarding: Cannot continue - no platforms connected');
                    return;
                  }
                  console.log('🔥 UniversalOnboarding: Continue clicked');
                  console.log('🔍 Current connectedAccounts state:', connectedAccounts);
                  // Ensure we pass the latest canonical names (capitalized) to parent
                  const connectedList = Object.entries(connectedAccounts)
                    .filter(([, v]) => !!v)
                    .map(([k]) => canonicalizePlatformName(k))
                    .filter(Boolean);
                  
                  // Detect newly connected platforms (for cache invalidation)
                  const newlyConnected = connectedList.filter(p => !initialPlatformsRef.current.has(p));
                  const hasNewPlatforms = newlyConnected.length > 0;
                  
                  console.log('✅ Sending to onComplete:', { 
                    connectedAccounts: connectedList, 
                    totalConnections: connectedList.length,
                    newlyConnected,
                    hasNewPlatforms,
                    initialPlatforms: Array.from(initialPlatformsRef.current)
                  });
                  
                  onComplete?.({ 
                    connectedAccounts: connectedList, 
                    totalConnections: connectedList.length,
                    newlyConnected,
                    hasNewPlatforms
                  });
                }}
              >
                Continue
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  fill="none" 
                  stroke={hasConnections ? '#ffffff' : '#9CA3AF'} 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            );
          })()}
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