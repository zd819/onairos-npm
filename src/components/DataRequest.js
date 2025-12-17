import React, { useState, useEffect } from "react";
// import personaImg from "../assets/persona.png";
// Use remote URL to avoid 403 Forbidden on local asset during dev/prod mismatch
const personaImg = "https://anushkasirv.sirv.com/persona.jpg";

/* -------------------------
   ICON COMPONENTS
-------------------------- */
const Icon = ({ type }) => {
  const base = "w-4 h-4 text-gray-700";

  switch (type) {
    case "User":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4
           1.79-4 4 1.79 4 4 4zm0 2c-2.67
           0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      );
    case "Memory":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2
           12s4.48 10 10 10 10-4.48 10-10S17.52
           2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      );
    case "Grid3X3":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10
           0h8V11h-8v10zm0-18v6h8V3h-8z"/>
        </svg>
      );
    case "Brain":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.99 2C6.47 2 2 6.48 2
           12s4.47 10 9.99 10C17.52
           22 22 17.52 22 12S17.52
           2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8
           8-8 8 3.58 8 8-3.58 8-8
           8zm3.5-9c.83 0 1.5-.67
           1.5-1.5S16.33 8 15.5
           8 14 8.67 14 9.5s.67 1.5
           1.5 1.5zm-7 0c.83 0 1.5-.67
           1.5-1.5S9.33 8 8.5
           8 7 8.67 7 9.5s.67 1.5
           1.5 1.5zm3.5 6.5c2.33
           0 4.31-1.46 5.11-3.5H6.89c.8
           2.04 2.78 3.5 5.11 3.5z"/>
        </svg>
      );
    default:
      return null;
  }
};

/* -------------------------
   TOGGLE (soft apple style)
-------------------------- */
const DataTypeToggle = ({ dataType, enabled, onToggle, isNative }) => {
  const handle = () => {
    if (dataType.required) return;
    onToggle(dataType.id, !enabled);
  };

  return (
    <button
      onClick={handle}
      className="
        w-full flex items-center justify-between
        py-2 px-2
        bg-white/40 backdrop-blur-sm
        hover:bg-white/70
        transition rounded-xl shadow-sm
      "
    >
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100">
          <Icon type={dataType.icon} />
        </div>
        <span className={`${isNative ? 'text-[14px]' : 'text-[13px]'} text-gray-900 font-medium`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          {dataType.name}
        </span>
      </div>

      <div
        className={`w-5 h-5 rounded-md border flex items-center justify-center shadow-sm
          transition
          ${enabled
            ? "bg-gray-900 border-gray-900"
            : "bg-white border-gray-300"
          }`}
      >
        {enabled && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M16.707 5.293a1 1 0 010
            1.414l-8 8a1 1 0 01-1.414
            0l-4-4a1 1 0 011.414-1.414L8
            12.586l7.293-7.293a1 1 0
            011.414 0z"/>
          </svg>
        )}
      </div>
    </button>
  );
};

/* -------------------------
   MAIN COMPONENT
-------------------------- */

const options = [
  { id: "basic", name: "Basic Profile", icon: "User", required: true },
  { id: "rawMemories", name: "Raw Memory Data", icon: "Memory" },
  { id: "preferences", name: "User Preferences", icon: "Grid3X3" },
  { id: "personality", name: "Personality Traits", icon: "Brain" },
];

const DataRequest = ({ appName = "My App", onComplete, onConnectMoreApps, connectedPlatforms = [], showTime = false }) => {
  const [selected, setSelected] = useState({
    basic: true,
    rawMemories: false,
    preferences: false,
    personality: false,
  });

  const [freq, setFreq] = useState("weekly");
  const [platformIconFailed, setPlatformIconFailed] = useState({});
  const [platforms, setPlatforms] = useState([]);

  const isWrappedApp = typeof appName === 'string' && appName.toLowerCase().includes('wrapped');

  // Normalize platform ids/names coming from different sources (SDK, backend, localStorage)
  // so logos always render (e.g. "linkedin" -> "LinkedIn").
  const normalizePlatformName = (p) => {
    const key = String(p || '').trim();
    const lower = key.toLowerCase();
    const map = {
      instagram: 'Instagram',
      youtube: 'YouTube',
      linkedin: 'LinkedIn',
      reddit: 'Reddit',
      pinterest: 'Pinterest',
      github: 'GitHub',
      facebook: 'Facebook',
      gmail: 'Gmail',
      twitter: 'Twitter',
      x: 'Twitter',
      chatgpt: 'ChatGPT',
      claude: 'Claude',
      gemini: 'Gemini',
      grok: 'Grok',
    };
    return map[lower] || (key ? key.charAt(0).toUpperCase() + key.slice(1) : '');
  };

  const toggle = (id, val) =>
    setSelected((p) => ({ ...p, [id]: val }));

  const selectedCount = Object.values(selected).filter(Boolean).length;

  // Ensure we actually show connected platforms even if prop isn't passed
  const getConnected = () => {
    console.log('📊 DataRequest getConnected:', { 
      connectedPlatforms, 
      isArray: Array.isArray(connectedPlatforms),
      type: typeof connectedPlatforms 
    });
    
    // Prefer localStorage as the source of truth (it is updated by UniversalOnboarding on OAuth return).
    // This avoids stale props causing "added platforms" to not show up until a full refresh.
    try {
      const u = JSON.parse(localStorage.getItem("onairosUser") || "{}");
      if (u && u.connectedAccounts) {
        // Check if it's an array
        if (Array.isArray(u.connectedAccounts)) {
          const normalized = u.connectedAccounts.map(normalizePlatformName).filter(Boolean);
          console.log('✅ Using localStorage connectedAccounts (array):', u.connectedAccounts, '→', normalized);
          return normalized;
        }
        // Check if it's an object
        if (typeof u.connectedAccounts === "object") {
          const mappedRaw = Object.entries(u.connectedAccounts).filter(([_, v]) => Boolean(v)).map(([k]) => k);
          const mapped = mappedRaw.map(normalizePlatformName).filter(Boolean);
          console.log('✅ Using localStorage connectedAccounts (object):', mappedRaw, '→', mapped);
          return mapped;
        }
      }
    } catch (e) {
      console.error('❌ Failed to read localStorage:', e);
    }

    // Fall back to prop if localStorage isn't available / doesn't have the field.
    // If array provided, use it
    if (Array.isArray(connectedPlatforms) && connectedPlatforms.length > 0) {
      const normalized = connectedPlatforms.map(normalizePlatformName).filter(Boolean);
      console.log('✅ Using connectedPlatforms prop (array):', connectedPlatforms, '→', normalized);
      return normalized;
    }
    
    // If object provided, map truthy keys
    if (connectedPlatforms && typeof connectedPlatforms === "object" && !Array.isArray(connectedPlatforms)) {
      const mappedRaw = Object.entries(connectedPlatforms).filter(([_, v]) => Boolean(v)).map(([k]) => k);
      const mapped = mappedRaw.map(normalizePlatformName).filter(Boolean);
      console.log('✅ Using connectedPlatforms prop (object):', mappedRaw, '→', mapped);
      return mapped;
    }
    
    console.log('⚠️ No connected platforms found');
    return [];
  };

  // Refresh platforms list on mount and when connectedPlatforms changes
  useEffect(() => {
    const refreshPlatforms = () => {
      // Small delay to allow localStorage to update if coming from another component
      setTimeout(() => {
        const newPlatforms = getConnected();
        console.log('🔄 DataRequest refreshing platforms:', newPlatforms);
        setPlatforms(newPlatforms);
      }, 50);
    };

    // Initial load
    refreshPlatforms();

    // Listen for custom event from UniversalOnboarding
    const handleConnectedAccountsUpdate = () => {
      console.log('📡 DataRequest received connectedAccountsUpdate event');
      refreshPlatforms();
    };
    
    // Listen for storage events (cross-tab/window updates)
    const handleStorageChange = (e) => {
      if (e.key === 'onairosUser') {
        console.log('💾 DataRequest detected storage change');
        refreshPlatforms();
      }
    };
    
    window.addEventListener('onairos-connected-accounts-update', handleConnectedAccountsUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('onairos-connected-accounts-update', handleConnectedAccountsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [connectedPlatforms]); // Re-run if connectedPlatforms prop changes

  console.log('🎯 Final platforms to display:', platforms);

  const isCapacitorNative = typeof window !== 'undefined' && 
    window.Capacitor && 
    typeof window.Capacitor.isNativePlatform === 'function' && 
    window.Capacitor.isNativePlatform();

  // Check if user has any LLM connections
  const hasLLMConnections = () => {
    const llmPlatforms = ['chatgpt', 'claude', 'gemini', 'grok', 'ChatGPT', 'Claude', 'Gemini', 'Grok'];
    return platforms.some(p => llmPlatforms.includes(p));
  };

  // Filter options based on LLM connections
  const availableOptions = options.filter(opt => {
    if (opt.id === 'rawMemories') {
      return hasLLMConnections();
    }
    return true;
  });

  const freqToPercent = (f) => (f === "once" ? 0 : f === "weekly" ? 50 : 100);
  const handleRailClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = x / rect.width;
    if (ratio < 1 / 3) setFreq("once");
    else if (ratio < 2 / 3) setFreq("weekly");
    else setFreq("daily");
  };

  return (
    <div className="flex flex-col h-full max-h-full md:max-h-[90vh] bg-white/70 backdrop-blur-2xl rounded-3xl overflow-hidden">

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 pt-3 md:pt-6 pb-2">

        {/* ICONS */}
        <div className="flex justify-center items-center gap-3 mb-3 md:mb-4">
          {/* Wrapped: Onairos -> Persona. Non-wrapped: Onairos -> app placeholder */}
          <div className={`${isCapacitorNative ? 'w-12 h-12' : 'w-10 h-10'} rounded-2xl bg-white shadow flex items-center justify-center`}>
            {isWrappedApp ? (
              <img 
                src="https://onairos.sirv.com/Images/OnairosBlack.png" 
                alt="Onairos"
                className={`${isCapacitorNative ? 'w-8 h-8' : 'w-6 h-6'} object-contain`}
              />
            ) : (
            <img 
              src="https://onairos.sirv.com/Images/OnairosBlack.png" 
              alt="Onairos"
                className={`${isCapacitorNative ? 'w-8 h-8' : 'w-6 h-6'} object-contain`}
            />
            )}
          </div>
          <svg className={`${isCapacitorNative ? 'w-6 h-6' : 'w-5 h-5'} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <div className={`${isCapacitorNative ? 'w-12 h-12' : 'w-10 h-10'} rounded-2xl bg-white shadow flex items-center justify-center`}>
            {isWrappedApp ? (
              <img 
                src={personaImg}
                alt="Persona"
                className={`${isCapacitorNative ? 'w-8 h-8' : 'w-6 h-6'} object-contain rounded-xl`}
                onError={(e) => { 
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.innerHTML = '<span class="text-xl">🎁</span>';
                }}
              />
            ) : (
              <span className={`${isCapacitorNative ? 'text-xl' : 'text-lg'} font-serif font-bold`} style={{ fontFamily: 'IBM Plex Sans, system-ui, sans-serif' }}>J</span>
            )}
          </div>
        </div>

        {/* TITLE */}
        <div className="text-center mb-4 md:mb-5">
          <h1 className={`${isCapacitorNative ? 'text-[22px] md:text-[24px]' : 'text-[20px] md:text-[22px]'} font-semibold text-gray-900 leading-tight tracking-tight`} style={{ fontFamily: 'IBM Plex Sans, system-ui, sans-serif' }}>
            {appName} wants to personalize your experience
          </h1>
          <p className={`${isCapacitorNative ? 'text-[13px]' : 'text-[12px]'} text-gray-500 mt-1`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>choose what to share</p>
        </div>

        {/* TOGGLES */}
        <div className={`${isCapacitorNative ? 'flex flex-col gap-2' : 'flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-3'} mb-4 md:mb-6`}>
          {availableOptions.map((opt) => (
            <DataTypeToggle
              key={opt.id}
              dataType={opt}
              enabled={selected[opt.id]}
              onToggle={toggle}
              isNative={isCapacitorNative}
            />
          ))}
        </div>

        {/* FREQUENCY PANEL - Only shown if showTime is true */}
        {showTime && (
          <div className="p-5 rounded-3xl bg-white/50 backdrop-blur-md border border-black/5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                How often can {appName} receive updates?
              </span>
              <span className="text-[11px] text-gray-500" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                {freq === "once"
                  ? "one-time only"
                  : freq === "weekly"
                  ? "once per week"
                  : "once per day"}
              </span>
            </div>

            {/* SLIDER: subtle rail, monochrome progress, click-to-set */}
            <div
              className="relative h-2.5 rounded-full bg-gray-200/90 overflow-hidden mb-4 border border-black/5 shadow-inner cursor-pointer"
              onClick={handleRailClick}
            >
              <div
                className="absolute h-full transition-all rounded-full"
                style={{
                  width: `${freqToPercent(freq)}%`,
                  background: "linear-gradient(90deg, rgba(31,41,55,0.95) 0%, rgba(107,114,128,0.9) 60%, rgba(209,213,219,0.85) 100%)",
                }}
              />
              {/* Tick marks for 3 stops */}
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3 bg-black/10" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-3 bg-black/10" />
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-3 bg-black/10" />
              {/* Thumb indicator (sleek) */}
              <span
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-white border border-black/20 shadow-md"
                style={{
                  left: `${freqToPercent(freq)}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-3 text-center text-[12px] font-medium" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              <button onClick={() => setFreq("once")} className="text-gray-700">1× only</button>
              <button onClick={() => setFreq("weekly")} className="text-gray-900 font-semibold">1× weekly</button>
              <button onClick={() => setFreq("daily")} className="text-gray-700">1× daily</button>
            </div>

            <p className="text-[11px] text-gray-500 mt-3 leading-snug" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              This only controls update frequency; It does not grant more access.
            </p>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <div className="px-6 py-3 md:py-4 bg-white/80 backdrop-blur border-t border-black/5">
        {/* Connected platforms pinned above CTAs so it never gets cropped on mobile */}
        {platforms && platforms.length > 0 && (
          <div className="mb-3 rounded-2xl bg-white/60 backdrop-blur border border-black/5 px-3 py-2.5">
            <div className="text-center mb-1">
              <div className="text-[13px] font-semibold text-gray-900" style={{ fontFamily: 'IBM Plex Sans, system-ui, sans-serif' }}>Connect Platforms</div>
              <div className="text-[11px] text-gray-500" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>more connections, smarter personalization</div>
            </div>
            <div className="flex items-center justify-center gap-2 overflow-x-auto whitespace-nowrap pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              {platforms.map((platform, index) => {
                const logoMap = {
                  Instagram: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
                  YouTube: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
                  LinkedIn: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
                  Reddit: 'https://upload.wikimedia.org/wikipedia/en/b/bd/Reddit_Logo_Icon.svg',
                  Pinterest: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png',
                  GitHub: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
                  Facebook: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
                  Gmail: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
                  Twitter: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg',
                  ChatGPT: 'https://anushkasirv.sirv.com/openai.png',
                  Claude: 'https://anushkasirv.sirv.com/claude-color.png',
                  Gemini: 'https://anushkasirv.sirv.com/gemini-color.png',
                  Grok: 'https://anushkasirv.sirv.com/grok.png'
                };
                const src = logoMap[platform] || '';
                const key = `${platform}-${index}`;
                const failed = !!platformIconFailed[key];
                const fallbackText = (() => {
                  if (platform === 'LinkedIn') return 'in';
                  if (platform === 'YouTube') return 'YT';
                  if (platform === 'ChatGPT') return 'AI';
                  return String(platform || '?').slice(0, 2).toUpperCase();
                })();
                return (
                  failed || !src ? (
                    <div
                      key={key}
                      title={platform}
                      className="w-6 h-6 rounded-md shadow-sm flex-shrink-0 bg-gray-100 text-gray-700 flex items-center justify-center text-[10px] font-semibold"
                    >
                      {fallbackText}
                    </div>
                  ) : (
                    <img
                      key={key}
                    src={src}
                    alt={platform}
                    title={platform}
                      className="w-6 h-6 rounded-md shadow-sm flex-shrink-0"
                      onError={() => setPlatformIconFailed((p) => ({ ...p, [key]: true }))}
                  />
                  )
                );
              })}
            </div>
            {typeof onConnectMoreApps === 'function' && (
              <div className="mt-1 flex justify-center">
                <button
                  type="button"
                  onClick={onConnectMoreApps}
                  className="text-[11px] font-medium text-gray-700 hover:text-gray-900 inline-flex items-center gap-1.5"
                  style={{ WebkitTextFillColor: '#111827', fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  <span style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Connect more</span>
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 text-gray-800 leading-none"
                    style={{ WebkitTextFillColor: '#111827' }}
                  >
                    +
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* If no platforms are connected yet, still allow user to go connect apps */}
        {(!platforms || platforms.length === 0) && typeof onConnectMoreApps === 'function' && (
          <div className="mb-3 rounded-2xl bg-white/60 backdrop-blur border border-black/5 px-3 py-2 text-center">
            <div className="text-[11px] text-gray-500 mb-1" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>No apps connected yet</div>
            <button
              type="button"
              onClick={onConnectMoreApps}
              className="text-[12px] font-medium underline underline-offset-2 text-gray-700 hover:text-gray-900"
              style={{ WebkitTextFillColor: '#111827', fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              Connect apps?
            </button>
      </div>
        )}
        <button
          className="w-full rounded-full py-3 bg-gray-900 text-sm font-medium shadow-sm flex items-center justify-center"
          style={{ color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif' }}
          disabled={selectedCount === 0}
          onClick={() => {
            if (selectedCount === 0) return;
            onComplete?.({
              approved: Object.keys(selected).filter(id => selected[id]),
              freq,
            });
          }}
        >
          Accept & Continue
        </button>
      </div>
    </div>
  );
};

export default DataRequest;
