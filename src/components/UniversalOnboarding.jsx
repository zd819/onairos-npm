import React, { useEffect, useId, useState } from 'react';

const defaultPersonaImages = {
  1: 'https://anushkasirv.sirv.com/persona1.png',
  2: 'https://anushkasirv.sirv.com/persona2.png',
  3: 'https://anushkasirv.sirv.com/persona3.png',
  4: 'https://anushkasirv.sirv.com/persona4.png',
  5: 'https://anushkasirv.sirv.com/persona5.png',
};

const sdkConfig = {
  apiKey: process.env.REACT_APP_ONAIROS_API_KEY || 'onairos_web_sdk_live_key_2024',
  baseUrl: process.env.REACT_APP_ONAIROS_BASE_URL || 'https://api2.onairos.uk',
  sdkType: 'web',
  enableHealthMonitoring: true,
  enableAutoRefresh: true,
  enableConnectionValidation: true,
};

export default function UniversalOnboarding({ onComplete, personaImages: personaImagesProp }) {
  const personaImages = personaImagesProp ?? defaultPersonaImages;

  const [connectedAccounts, setConnectedAccounts] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState(null);
  const [selected, setSelected] = useState('Google');

  // viewport -> responsive lifts
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const FOOTER_H = 88;

  // persona bg sizing + lift
  const personaSide = Math.min(vh * 0.70, 640);
  const PERSONA_LIFT = -Math.min(Math.max(vh * 0.12, 64), 104); // raise a bit more

  // icon band sizing + lift (smaller icons)
  const SLOT = 60;
  const CIRCLE = 42;
  const GAP = 20;
  const ACTIVE_SCALE = vh < 760 ? 1.18 : 1.35;

  const ICONS_H = 84;
  const ICONS_LIFT = -Math.min(Math.max(vh * 0.26, 180), 240);
  const GAP_AFTER_ICONS = 28;                 // firm gap so they never touch
  const SHEET_LIFT = ICONS_LIFT + ICONS_H + GAP_AFTER_ICONS;
  


  const igGradId = useId();

  const icons = {
    gmail: (
      <svg viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
    reddit: (
      <svg viewBox="0 0 24 24">
        <path fill="#FF4500" d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.327.327 0 0 0-.231.094z"/>
        </svg>
      ),
    instagram: (
      <svg viewBox="0 0 24 24">
          <defs>
          <radialGradient id={igGradId} cx="0.5" cy="1" r="1">
            <stop offset="0%" stopColor="#FD5949"/><stop offset="50%" stopColor="#D6249F"/><stop offset="100%" stopColor="#285AEB"/>
            </radialGradient>
          </defs>
        <path fill={`url(#${igGradId})`} d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.073-1.689-.073-4.849 0-3.204.013-3.583.072-4.948.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/>
        </svg>
      ),
    linkedin: (
      <svg viewBox="0 0 24 24"><path fill="#0077B5" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    ),
    pinterest: (
      <svg viewBox="0 0 24 24"><path fill="#E60023" d="M12 0C5.373 0 0 5.372 0 12s5.373 12 12 12c6.628 0 12-5.372 12-12S18.628 0 12 0zm0 19c-.721 0-1.418-.109-2.073-.312.286-.465.713-1.227.87-1.835l.437-1.664c.229.436.895.8 1.604.8 2.111 0 3.633-1.941 3.633-4.354 0-2.312-1.895-4.049-4.218-4.049-2.972 0-4.684 1.946-4.684 4.338 0 1.083.424 2.42 1.218 2.847.131.07.201.04.232-.107.023-.106.151-.602.2-.784.067-.25.041-.336-.145-.553-.408-.474-.615-1.088-.615-1.72 0-1.658 1.222-3.259 3.297-3.259 1.798 0 3.064 1.244 3.064 3.018 0 2.019-.864 3.423-2.024 3.423-.633 0-1.106-.537-.954-1.196.181-.788.532-1.637.532-2.204 0-.508-.267-.932-.822-.932-.652 0-1.176.685-1.176 1.602 0 .584.197.98.197.98l-.79 3.396C6.595 16.85 6.017 14.47 6.017 12c0-3.313 2.687-6 6-6s6 2.687 6 6-2.687 6-6 6z"/></svg>
    ),
  };

  const descriptions = {
    Google: <>We use your <strong className="font-semibold">search</strong>, <strong className="font-semibold">YouTube</strong>, and <strong className="font-semibold">location signals</strong> to better understand your interests and routines.</>,
    Reddit: <>We use your <strong className="font-semibold">search history</strong> to better understand your interests and routines.</>,
    Instagram: <>We use your <strong className="font-semibold">photos</strong> and <strong className="font-semibold">interactions</strong> to learn visual preferences.</>,
    LinkedIn: <>We use your <strong className="font-semibold">professional graph</strong> and <strong className="font-semibold">content</strong> to infer career interests.</>,
    Pinterest: <>We use your <strong className="font-semibold">pins</strong> and <strong className="font-semibold">boards</strong> to understand creative tastes.</>,
  };

  const platforms = [
    { name: 'Google', connector: 'gmail', icon: icons.gmail },
    { name: 'Reddit', connector: 'reddit', icon: icons.reddit },
    { name: 'Instagram', connector: 'instagram', icon: icons.instagram },
    { name: 'LinkedIn', connector: 'linkedin', icon: icons.linkedin },
    { name: 'Pinterest', connector: 'pinterest', icon: icons.pinterest },
  ];

  useEffect(() => {
    const p = localStorage.getItem('onairos_oauth_platform');
    if (p) {
      localStorage.removeItem('onairos_oauth_platform');
      localStorage.removeItem('onairos_oauth_return');
      setConnectedAccounts((s) => ({ ...s, [p]: true }));
    }
  }, []);

  async function connectToPlatform(name) {
    const plat = platforms.find((p) => p.name === name);
    if (!plat) return false;
    try {
      setIsConnecting(true);
      setConnectingPlatform(name);
      const username =
        localStorage.getItem('username') ||
        (JSON.parse(localStorage.getItem('onairosUser') || '{}')?.email) ||
        'user@example.com';

      const res = await fetch(`${sdkConfig.baseUrl}/${plat.connector}/authorize`, {
        method: 'POST',
        headers: { 'x-api-key': sdkConfig.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: { username } }),
      });
      if (!res.ok) throw new Error('auth failed');
      const data = await res.json();

      const candidates =
        {
          youtube: ['youtubeURL','youtubeUrl','youtube_url'],
          linkedin: ['linkedinURL','linkedinUrl','linkedin_url'],
          reddit: ['redditURL','redditUrl','reddit_url'],
          pinterest: ['pinterestURL','pinterestUrl','pinterest_url'],
          instagram: ['instagramURL','instagramUrl','instagram_url'],
          github: ['githubURL','githubUrl','github_url'],
          facebook: ['facebookURL','facebookUrl','facebook_url'],
          gmail: ['gmailURL','gmailUrl','gmail_url'],
        }[plat.connector] ||
        [`${plat.connector}URL`, `${plat.connector}Url`, `${plat.connector}_url`, 'platformURL', 'authUrl', 'url'];

      let oauthUrl = null;
      for (const k of candidates) if (data[k]) { oauthUrl = data[k]; break; }
      if (!oauthUrl) throw new Error('no url');

      const popup = window.open(
        oauthUrl,
        `${plat.connector}_oauth`,
        'width=500,height=600,scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no'
      );
      if (!popup) throw new Error('popup blocked');

      let touched = false;
      const it = setInterval(() => {
        try { if (popup.location && popup.location.hostname === 'onairos.uk') { touched = true; popup.close(); } } catch { if (!touched) touched = true; }
        try {
          if (popup.closed) {
            clearInterval(it);
            setConnectedAccounts((s) => ({ ...s, [name]: true }));
            setIsConnecting(false);
            setConnectingPlatform(null);
          }
        } catch {}
      }, 800);

      setTimeout(() => { try { if (!popup.closed && touched) popup.close(); } catch {} }, 10000);
      setTimeout(() => { if (!popup.closed) { popup.close(); clearInterval(it); setIsConnecting(false); setConnectingPlatform(null); } }, 300000);
      return true;
    } catch {
      setIsConnecting(false);
      setConnectingPlatform(null);
      return false;
    }
  }

  const handleSwitch = async (name) => {
    if (isConnecting && connectingPlatform !== name) return;
    const on = !!connectedAccounts[name];
    if (on) setConnectedAccounts((s) => ({ ...s, [name]: false }));
    else await connectToPlatform(name);
  };

  const connectedCount = Object.values(connectedAccounts).filter(Boolean).length;
  const personaNumber = Math.min(connectedCount + 1, 5);

  return (
      <div className="w-full h-full flex flex-col relative" style={{ height: '100vh', minHeight: 0, paddingBottom: FOOTER_H + 60 }}>
      {/* header */}
      <div className="px-6 pt-16 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">Connect App Data</h1>
        <p className="text-gray-600 text-base">More Connections, Better Personalization.</p>
          </div>

      {/* persona (bg) */}
      <div className="px-6 flex-1 flex items-center justify-center" style={{ marginTop: PERSONA_LIFT, zIndex: 1 }}>
        <div className="overflow-hidden rounded-[28px]" style={{ width: personaSide, height: personaSide }}>
          <img
            src={personaImages[personaNumber]}
            alt={`Persona ${personaNumber}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const parent = e.currentTarget.parentElement;
              e.currentTarget.style.display = 'none';
              if (parent) parent.style.background = 'linear-gradient(135deg,#f97316 0%,#ec4899 50%,#8b5cf6 100%)';
            }}
          />
        </div>
      </div>

       {/* icons — positioned much higher up, overlapping hero image */}
       <div className="px-6 flex-shrink-0" style={{ height: ICONS_H, marginTop: -200, zIndex: 5, position: 'relative' }}>
         <div className="h-full flex items-center justify-center">
           <div
             className="grid w-full box-border"
                    style={{
               gridTemplateColumns: 'repeat(5, 1fr)',
               columnGap: GAP,
               alignItems: 'center',
               justifyItems: 'center',
               paddingInline: 8,
             }}
           >
             {platforms.map((p) => {
               const on = !!connectedAccounts[p.name];
               const busy = isConnecting && connectingPlatform === p.name;
               const isSel = selected === p.name;
               return (
                 <div key={p.name} className="flex items-center justify-center" style={{ width: SLOT, height: SLOT }}>
                   <button
                     type="button"
                     onClick={() => {
                       setSelected(p.name);
                       handleSwitch(p.name);
                     }}
                     className="relative grid place-items-center outline-none"
                     style={{ width: SLOT, height: SLOT }}
                     title={p.name}
                   >
                     <div
                        className={`rounded-full border-3 transition-all duration-150 ease-out flex items-center justify-center shadow-lg
                                    ${on ? 'border-blue-600 bg-white text-black shadow-blue-500/70' : 'border-gray-300 hover:border-gray-400 bg-white text-black'}`}
                        style={{
                         width: CIRCLE,
                         height: CIRCLE,
                         transform: `scale(${isSel ? ACTIVE_SCALE : 1})`,
                         transformOrigin: 'center',
                         willChange: 'transform',
                         boxShadow: on ? '0 0 0 4px rgba(59, 130, 246, 0.4), 0 0 0 8px rgba(59, 130, 246, 0.2), 0 0 25px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                       }}
                     >
                       {busy ? (
                         <div className="animate-spin h-4 w-4 border-2 border-gray-400 rounded-full border-t-transparent" />
                       ) : (
                         <div className="flex items-center justify-center" style={{ width: 18, height: 18 }}>
                           {React.cloneElement(p.icon, { width: 18, height: 18, style: { display: 'block' } })}
                         </div>
                       )}
                     </div>
                   </button>
                    </div>
               );
             })}
                      </div>
                    </div>
                  </div>

       {/* info sheet — positioned directly below icons with minimal gap */}
       <div className="px-6 flex-shrink-0" style={{ paddingTop: 5, paddingBottom: 20 }}>
        <div className="mx-auto rounded-2xl bg-white shadow-sm border border-gray-200 px-4 py-3" style={{ width: 'min(680px,92%)' }}>
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
              <span
                className="absolute bg-white rounded-full shadow"
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
            </div>
          </div>
        </div>

       {/* footer — fixed at bottom with proper spacing */}
       <div className="absolute left-0 right-0 px-6" style={{ bottom: 16, height: FOOTER_H + 20, zIndex: 10 }}>
          <div
            className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-full py-4 text-base font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
          onClick={() => {
            const connected = Object.entries(connectedAccounts).filter(([, v]) => v).map(([k]) => k);
            onComplete?.({ connectedAccounts: connected, totalConnections: connected.length });
          }}
          >
            Update
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div
          onClick={() => onComplete?.({ connectedAccounts: [], totalConnections: 0 })}
          className="w-full text-gray-600 text-base font-medium py-2 text-center cursor-pointer hover:text-gray-800 transition-colors"
          >
            Skip
        </div>
      </div>
    </div>
  );
}
