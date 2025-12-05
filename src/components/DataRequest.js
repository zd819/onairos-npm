import React, { useState } from "react";

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
const DataTypeToggle = ({ dataType, enabled, onToggle }) => {
  const handle = () => {
    if (dataType.required) return;
    onToggle(dataType.id, !enabled);
  };

  return (
    <button
      onClick={handle}
      className="
        w-full flex items-center justify-between
        py-2.5 px-2
        bg-white/40 backdrop-blur-sm
        hover:bg-white/70
        transition rounded-xl shadow-sm
      "
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">
          <Icon type={dataType.icon} />
        </div>
        <span className="text-[14px] text-gray-900 font-medium">
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

const DataRequest = ({ appName = "My App", onComplete, connectedPlatforms = [] }) => {
  const [selected, setSelected] = useState({
    basic: true,
    rawMemories: false,
    preferences: false,
    personality: false,
  });

  const [freq, setFreq] = useState("weekly");

  const toggle = (id, val) =>
    setSelected((p) => ({ ...p, [id]: val }));

  const selectedCount = Object.values(selected).filter(Boolean).length;

  // Ensure we actually show connected platforms even if prop isn't passed
  const getConnected = () => {
    // If array provided, use it
    if (Array.isArray(connectedPlatforms) && connectedPlatforms.length > 0) return connectedPlatforms;
    // If object provided, map truthy keys
    if (connectedPlatforms && typeof connectedPlatforms === "object" && !Array.isArray(connectedPlatforms)) {
      return Object.entries(connectedPlatforms).filter(([_, v]) => Boolean(v)).map(([k]) => k);
    }
    // Fallback: try localStorage onairosUser
    try {
      const u = JSON.parse(localStorage.getItem("onairosUser") || "{}");
      if (u && u.connectedAccounts && typeof u.connectedAccounts === "object") {
        return Object.entries(u.connectedAccounts).filter(([_, v]) => Boolean(v)).map(([k]) => k);
      }
    } catch {}
    return [];
  };
  const platforms = getConnected();

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
    <div className="flex flex-col h-full max-h-[90vh] bg-white/70 backdrop-blur-2xl rounded-3xl overflow-hidden">

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 pt-10 pb-4">

        {/* ICONS */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white shadow flex items-center justify-center">
            <Icon type="User" />
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor">
            <path strokeWidth={2} strokeLinecap="round" d="M9 5l7 7-7 7"/>
          </svg>
          <div className="w-12 h-12 rounded-2xl bg-white shadow flex items-center justify-center">
            <span className="text-xl font-serif font-bold">B</span>
          </div>
        </div>

        {/* TITLE */}
        <div className="text-center mb-8">
          <h1 className="text-[24px] md:text-[26px] font-semibold text-gray-900 leading-tight tracking-tight">
            {appName} wants to personalize your experience
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">choose what to share</p>
        </div>

        {/* TOGGLES */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {options.map((opt) => (
            <DataTypeToggle
              key={opt.id}
              dataType={opt}
              enabled={selected[opt.id]}
              onToggle={toggle}
            />
          ))}
        </div>

        {/* FREQUENCY PANEL */}
        <div className="p-5 rounded-3xl bg-white/50 backdrop-blur-md border border-black/5 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-900">
              How often can {appName} receive updates?
            </span>
            <span className="text-[11px] text-gray-500">
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

          <div className="grid grid-cols-3 text-center text-[12px] font-medium">
            <button onClick={() => setFreq("once")} className="text-gray-700">1× only</button>
            <button onClick={() => setFreq("weekly")} className="text-gray-900 font-semibold">1× weekly</button>
            <button onClick={() => setFreq("daily")} className="text-gray-700">1× daily</button>
          </div>

          <p className="text-[11px] text-gray-500 mt-3 leading-snug">
            This only controls update frequency; It does not grant more access.
          </p>
        </div>

        {/* CONNECTED PLATFORMS (appears at the bottom of content; no overlap with footer) */}
        {platforms && platforms.length > 0 ? (
          <div className="mt-6 mb-2 rounded-2xl bg-white/60 backdrop-blur border border-black/5 p-3">
            <div className="text-center text-xs text-gray-500 mb-2">Connected Platforms</div>
            <div className="flex justify-center items-center gap-2 flex-wrap">
              {platforms.map((platform, index) => {
                const logoMap = {
                  Instagram: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
                  YouTube: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
                  LinkedIn: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
                  Reddit: 'https://www.redditinc.com/assets/images/site/reddit-logo.png',
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
                return (
                  <img
                    key={`${platform}-${index}`}
                    src={src}
                    alt={platform}
                    title={platform}
                    className="w-6 h-6 rounded-md shadow-sm hover:scale-110 transition"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* FOOTER */}
      <div className="px-6 py-5 bg-white/80 backdrop-blur border-t border-black/5">
        <button
          className="w-full rounded-full py-3 bg-gray-900 !text-white text-sm font-medium shadow-sm flex items-center justify-center mb-3"
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

        <style>{`
          .decline-button {
            color: #000000 !important;
          }
          .decline-button * {
            color: #000000 !important;
          }
          .decline-button span {
            color: #000000 !important;
          }
          button.decline-button {
            color: #000000 !important;
          }
          .decline-button-text {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
          }
        `}</style>
        <button
          className="w-full rounded-full py-3 bg-gray-100 text-sm font-medium shadow-sm decline-button"
          style={{ color: '#000000' }}
          onClick={() => {
            onComplete?.({
              approved: [],
              freq,
              declined: true,
            });
          }}
        >
          <span className="decline-button-text" style={{ color: '#000000' }}>Decline</span>
        </button>
      </div>
    </div>
  );
};

export default DataRequest;
