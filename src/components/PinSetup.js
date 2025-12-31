import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function PinSetup({ onComplete, onBack, userEmail }) {
  const [pin, setPin] = useState('');
  const [pinRequirements, setPinRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);

  const isMobileViewport = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  }, []);

  // Check PIN requirements
  useEffect(() => {
    setPinRequirements({
      length: pin.length >= 6,
      uppercase: /[A-Z]/.test(pin),
      number: /\d/.test(pin),
      specialChar: /[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(pin),
    });
  }, [pin]);

  // Mobile keyboard handling: keep requirements/CTA accessible while typing.
  // Many mobile browsers block/resist `window.close()` and also overlay the keyboard on top of fixed-height modals.
  // We detect keyboard height via visualViewport and add bottom padding + lift the footer.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isMobileViewport) return;
    if (!window.visualViewport) return;

    const vv = window.visualViewport;
    const update = () => {
      // On most mobile browsers, keyboard reduces visualViewport.height while window.innerHeight stays stable-ish.
      // Clamp to [0, ...] to avoid negative offsets.
      const raw = window.innerHeight - vv.height;
      const next = Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0;
      setKeyboardOffset(next);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('resize', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [isMobileViewport]);

  const allRequirementsMet = pinRequirements.length && pinRequirements.uppercase && pinRequirements.number && pinRequirements.specialChar;

  const handleSubmit = () => {
    if (allRequirementsMet) {
      onComplete({
        pin: pin, // This should be hashed in production
        pinCreated: true,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ height: '100%', minHeight: 0 }}>
      {/* Content - Flexible center area */}
      <div
        ref={scrollAreaRef}
        className="px-6 pt-16 flex-1 flex flex-col overflow-y-auto"
        style={{
          minHeight: 0,
          // Ensure content can scroll above the on-screen keyboard + bottom CTA.
          paddingBottom: isMobileViewport ? Math.max(16, keyboardOffset + 16) : undefined,
        }}
      >
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'IBM Plex Sans, system-ui, sans-serif' }}>Create a Secret Code</h1>
          <p className="text-gray-600 text-base" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>A secret code so only you have access to your data</p>
        </div>

        <div className="mb-6 flex-shrink-0">
          <input
            ref={inputRef}
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl text-center text-lg font-medium focus:border-gray-900 focus:outline-none bg-white !text-black"
            placeholder="Enter your secret code"
            maxLength={20}
            onFocus={() => {
              if (!isMobileViewport) return;
              // Give the keyboard a beat to appear, then ensure the input stays visible.
              window.setTimeout(() => {
                try {
                  inputRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
                } catch (_) {}
              }, 200);
            }}
            style={{
              WebkitTextFillColor: '#000000',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              caretColor: '#000000',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          />
        </div>

        {/* Requirements list - NO SCROLL ISOLATION to prevent nesting issues */}
        <div className="pb-4">
          <p className="text-gray-900 font-medium mb-4">Your secret code must:</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 ${pinRequirements.length ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"}`}
              >
                {pinRequirements.length && (
                  <svg className="w-3 h-3 text-white m-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-gray-700">Be at least 6 characters in length.</span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 ${pinRequirements.uppercase ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"}`}
              >
                {pinRequirements.uppercase && (
                  <svg className="w-3 h-3 text-white m-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-gray-700">Contain an uppercase letter.</span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 ${pinRequirements.number ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"}`}
              >
                {pinRequirements.number && (
                  <svg className="w-3 h-3 text-white m-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-gray-700">Contain a number.</span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 ${pinRequirements.specialChar ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"}`}
              >
                {pinRequirements.specialChar && (
                  <svg className="w-3 h-3 text-white m-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-gray-700">Contain a special character/symbol.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons - Fixed at bottom */}
      <div
        className="px-6 pb-6 pt-4 flex-shrink-0 space-y-3 bg-white"
        style={{
          minHeight: 'auto',
          // Lift footer above the mobile keyboard so the requirements list isn't "trapped" underneath.
          transform: isMobileViewport && keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : undefined,
          transition: isMobileViewport ? 'transform 160ms ease-out' : undefined,
          willChange: isMobileViewport ? 'transform' : undefined,
        }}
      >
        <div
          className={`w-full rounded-full py-4 text-base font-medium flex items-center justify-center gap-2 transition-colors ${
            allRequirementsMet 
              ? "bg-gray-900 hover:bg-gray-800 cursor-pointer" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          style={allRequirementsMet ? { color: '#ffffff' } : {}}
          onClick={allRequirementsMet ? handleSubmit : undefined}
        >
          Continue
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
} 