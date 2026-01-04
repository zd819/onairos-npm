import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const BOOKMARKLET_HREF =
  "javascript:(async()=>{let loader=null;function showLoader(msg){if(!loader){loader=document.createElement('div');loader.style.cssText='position:fixed;top:20px;right:20px;width:280px;background:rgba(15,23,42,0.95);color:white;padding:14px 20px;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;font-size:13px;font-weight:500;z-index:999999;box-shadow:0 8px 24px rgba(0,0,0,0.4),0 2px 8px rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(12px);line-height:1.4;text-align:center';document.body.appendChild(loader)}loader.textContent=msg}function hideLoader(){if(loader){loader.remove();loader=null}}function h(){try{const e=window.location.hostname||'';return e==='chat.openai.com'||e==='chatgpt.com'||e.endsWith('.chatgpt.com')}catch{return false}}function getDeviceId(){try{const c=document.cookie.match(/oai-did=([^;]+)/);return c?c[1]:null}catch{return null}}async function getAccessToken(){const url=`${window.location.origin}/api/auth/session`;const r=await fetch(url,{method:'GET',credentials:'include',headers:{'Accept':'application/json','Referer':window.location.origin}});if(!r.ok)return null;const data=await r.json();return data?.accessToken||null}async function fetchList(token,deviceId){const url=`${window.location.origin}/backend-api/conversations?offset=0&limit=10`;const headers={'Accept':'*/*','oai-language':'en-US'};if(token)headers['Authorization']=`Bearer ${token}`;if(deviceId)headers['oai-device-id']=deviceId;const r=await fetch(url,{method:'GET',credentials:'include',headers});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}async function fetchConvo(id,token,deviceId){const url=`${window.location.origin}/backend-api/conversation/${id}`;const headers={'Accept':'*/*','oai-language':'en-US','Referer':window.location.origin};if(token)headers['Authorization']=`Bearer ${token}`;if(deviceId)headers['oai-device-id']=deviceId;const r=await fetch(url,{method:'GET',credentials:'include',headers});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}async function fetchMemories(token,deviceId){const url=`${window.location.origin}/backend-api/memories?include_memory_entries=true&memory_entries_filter=all`;const headers={'Accept':'application/json','Referer':window.location.origin};if(token)headers['Authorization']=`Bearer ${token}`;if(deviceId)headers['oai-device-id']=deviceId;try{const r=await fetch(url,{method:'GET',credentials:'include',headers});if(!r.ok)return null;return r.json()}catch{return null}}function extractUserMessages(data){const mapping=data?.mapping||{};const msgs=[];for(const node of Object.values(mapping)){const msg=node?.message;if(!msg||!msg.author)continue;if(msg.author.role!=='user')continue;const time=msg.create_time?new Date(msg.create_time*1000).toISOString():null;let text='';const content=msg.content||{};if(Array.isArray(content.parts)){text=content.parts.join('\\n').trim()}else if(content.text){text=content.text.trim()}if(text){msgs.push({content:text,timestamp:time})}}return msgs}if(!h()){alert('⚠️ Please open ChatGPT and try again.');return}const popup=window.open('about:blank','OnairosSync','width=500,height=600');if(!popup){alert('⚠️ Please allow popups for ChatGPT to sync with Onairos!\\n\\nEnable popups and try again.');return}popup.document.write('<html><head><title>Onairos Sync</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:\"Söhne\",-apple-system,BlinkMacSystemFont,\"Segoe UI\",Helvetica,Arial,sans-serif;background:#0D0D0D;color:#ECECEC;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}.container{max-width:450px;width:100%;background:#212121;border-radius:16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.4)}h1{font-size:24px;font-weight:600;text-align:center;margin-bottom:8px}.subtitle{font-size:14px;color:#8E8EA0;text-align:center;margin-bottom:32px}.status-text{text-align:center;font-size:16px;margin-bottom:16px}.spinner{width:40px;height:40px;border:3px solid #2F2F2F;border-top-color:#10A37F;border-radius:50%;animation:spin 0.6s linear infinite;margin:0 auto 16px}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class=\"container\"><h1>✨ Onairos Sync</h1><p class=\"subtitle\">Collecting your ChatGPT data</p><div class=\"spinner\"></div><div class=\"status-text\" id=\"status\">Starting...</div></div></body></html>');popup.document.close();function updatePopup(msg){try{if(popup&&!popup.closed){popup.document.getElementById('status').textContent=msg}}catch(e){}}showLoader('🚀 Starting export...');console.log('[Onairos] 🚀 Starting export...');(async()=>{try{updatePopup('🔑 Getting access token...');showLoader('🔑 Getting access token...');const token=await getAccessToken();const deviceId=getDeviceId();if(!token){hideLoader();updatePopup('❌ Could not get access token. Make sure you\\'re logged into ChatGPT.');setTimeout(()=>popup.close(),5000);return}updatePopup('📋 Fetching conversations...');showLoader('📋 Fetching conversations...');let list;try{list=await fetchList(token,deviceId)}catch(err){hideLoader();updatePopup('❌ Failed: '+err.message);setTimeout(()=>popup.close(),5000);return}const items=(list?.items||[]).slice(0,10);if(items.length===0){hideLoader();updatePopup('⚠️ No conversations found');setTimeout(()=>popup.close(),3000);return}const convos=[];for(let i=0;i<items.length;i++){const c=items[i];updatePopup(`📥 ${i+1}/${items.length}: ${c.title||'Untitled'}...`);showLoader(`📥 ${i+1}/${items.length}: ${c.title||'Untitled'}...`);try{const data=await fetchConvo(c.id,token,deviceId);const userMsgs=extractUserMessages(data);convos.push({id:c.id,title:c.title||'Untitled',url:`${window.location.origin}/c/${c.id}`,messageCount:userMsgs.length,messages:userMsgs})}catch(err){convos.push({id:c.id,title:c.title||'Untitled',error:err.message})}}updatePopup('🧠 Fetching memories...');showLoader('🧠 Fetching memories...');const memories=await fetchMemories(token,deviceId);updatePopup('💾 Syncing to Onairos...');showLoader('💾 Syncing to Onairos...');const userData=JSON.parse(localStorage.getItem('onairosUser')||'{}');let jwtToken=userData.token||localStorage.getItem('onairos_user_token');if(!jwtToken){hideLoader();updatePopup('❌ Please log into Onairos first');setTimeout(()=>popup.close(),5000);return}const syncData={convos,memories,token:jwtToken};updatePopup('🔄 Opening sync page...');const form=popup.document.createElement('form');form.method='POST';form.action='https://api2.onairos.uk/chatgpt-sync';form.style.display='none';const input=popup.document.createElement('input');input.type='hidden';input.name='data';input.value=JSON.stringify(syncData);form.appendChild(input);popup.document.body.appendChild(form);form.submit();hideLoader();console.log('✅ [Onairos] Submitting sync form')}catch(e){hideLoader();updatePopup('❌ Error: '+e.message);console.error(e);setTimeout(()=>popup.close(),5000)}})()})();";

// Special lightweight bookmarklet for mobile
const MOBILE_BOOKMARKLET_HREF = "javascript:(async()=>{let overlay=document.getElementById('onairos-overlay');if(!overlay){overlay=document.createElement('div');overlay.id='onairos-overlay';overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.98);color:#ECECEC;z-index:9999999;display:flex;flex-direction:column;font-family:system-ui,sans-serif;padding:20px;box-sizing:border-box;overflow:hidden;';const header=document.createElement('div');header.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;flex-shrink:0;';header.innerHTML='<h2 style=margin:0;font-size:18px;font-weight:600>✨ Onairos Mobile</h2><button id=onairos-close style=background:transparent;border:none;color:#94a3b8;font-size:24px;padding:5px>&times;</button>';overlay.appendChild(header);const status=document.createElement('div');status.id='onairos-status';status.style.cssText='font-size:14px;color:#10b981;margin-bottom:10px;font-weight:500;min-height:20px;';status.textContent='Initializing...';overlay.appendChild(status);const content=document.createElement('textarea');content.id='onairos-content';content.style.cssText='flex:1;width:100%;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:12px;font-family:monospace;font-size:12px;resize:none;margin-bottom:15px;';content.readOnly=true;content.placeholder='Data will appear here...';overlay.appendChild(content);const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;flex-shrink:0;';const copyBtn=document.createElement('button');copyBtn.id='onairos-copy';copyBtn.textContent='📋 Copy Data';copyBtn.style.cssText='flex:1;background:#10b981;color:white;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:16px;';actions.appendChild(copyBtn);overlay.appendChild(actions);document.body.appendChild(overlay);document.getElementById('onairos-close').onclick=()=>overlay.remove();document.getElementById('onairos-copy').onclick=()=>{const el=document.getElementById('onairos-content');el.select();el.setSelectionRange(0,99999);document.execCommand('copy');navigator.clipboard.writeText(el.value).then(()=>{document.getElementById('onairos-status').textContent='✅ Copied!'}).catch(()=>{document.getElementById('onairos-status').textContent='❌ Copy failed'})}}const updateStatus=(msg)=>{const el=document.getElementById('onairos-status');if(el)el.textContent=msg};const setContent=(text)=>{const el=document.getElementById('onairos-content');if(el)el.value=text};if(!window.location.hostname.includes('chatgpt.com')&&!window.location.hostname.includes('openai.com')){alert('⚠️ Please open ChatGPT (chatgpt.com)');return}async function getAccessToken(){try{const r=await fetch('/api/auth/session');if(!r.ok)return null;return(await r.json())?.accessToken}catch{return null}}async function fetchList(t){const r=await fetch('/backend-api/conversations?offset=0&limit=5',{headers:{'Authorization':`Bearer ${t}`}});return r.json()}async function fetchConvo(id,t){const r=await fetch(`/backend-api/conversation/${id}`,{headers:{'Authorization':`Bearer ${t}`}});return r.json()}try{updateStatus('🔑 Auth...');const t=await getAccessToken();if(!t){updateStatus('❌ Not logged in');return}updateStatus('📋 Fetching...');const l=await fetchList(t);const items=(l?.items||[]).slice(0,5);const allData={exportedAt:new Date().toISOString(),conversations:[]};for(const item of items){updateStatus(`📥 ${item.title?item.title.substring(0,15):'Untitled'}...`);try{const d=await fetchConvo(item.id,t);allData.conversations.push(d)}catch(e){console.error(e)}}setContent(JSON.stringify(allData,null,2));updateStatus('✅ Done!')}catch(e){updateStatus('❌ '+e.message)}})();";

export const getOnairosChatGPTBookmarklet = () => BOOKMARKLET_HREF;

export default function ConnectChatGPTModal({ open, onClose, onConnected }) {
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debug log to confirm render attempt
  if (open) {
    console.log('🚀 ConnectChatGPTModal rendering! Open:', open, 'Mobile:', isMobile);
  }

  if (!open) return null;

  // Get user token from localStorage to embed in bookmarklet
  const getUserToken = () => {
    try {
      // Try onairos_user_token first
      const directToken = localStorage.getItem('onairos_user_token');
      if (directToken) return directToken;
      
      // Try onairosUser.token
      const userData = JSON.parse(localStorage.getItem('onairosUser') || '{}');
      if (userData.token) return userData.token;
      
      return null;
    } catch (e) {
      console.error('Error getting token:', e);
      return null;
    }
  };

  const userToken = getUserToken();
  console.log('🔑 User token for bookmarklet:', userToken ? userToken.substring(0, 20) + '...' : 'NOT FOUND');

  // Create bookmarklet with embedded token
  const createBookmarkletWithToken = (token) => {
    if (!token) {
      // Fallback to original bookmarklet that checks localStorage
      return BOOKMARKLET_HREF;
    }
    
    // Embed the token directly in the bookmarklet
    return BOOKMARKLET_HREF.replace(
      'const userData=JSON.parse(localStorage.getItem(\'onairosUser\')||\'{}\')',
      `const userData={token:'${token}'}`
    );
  };

  const bookmarkletHref = createBookmarkletWithToken(userToken);
  
  // For mobile, we just use the fixed string since manual copy is easier without dynamic token injection
  // (User just sees data, doesn't sync automatically to backend in this v1)
  const mobileBookmarkletCode = MOBILE_BOOKMARKLET_HREF;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mobileBookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGotIt = () => {
    if (typeof onConnected === 'function') {
      onConnected();
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Use a portal to break out of any parent transforms/overflows
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 2147483647, pointerEvents: 'auto' }}>
      <style>{`
        @keyframes gentlePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(148, 163, 184, 0.35); }
          50% { box-shadow: 0 0 0 10px rgba(148, 163, 184, 0); }
        }
        .bookmarklet-button {
          background: rgba(15, 23, 42, 0.85);
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.16);
          backdrop-filter: blur(18px);
        }
        .bookmarklet-button:hover {
          background: rgba(15, 23, 42, 0.92);
        }
        @keyframes fadeInScale {
          0% { opacity: 0; transform: translateY(8px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chatgpt-modal-card {
          animation: fadeInScale 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .step-circle {
          background: rgba(15, 23, 42, 0.9);
          min-width: 28px;
          width: 28px;
          height: 28px;
        }
        .chatgpt-got-it-button {
          color: #FFFFFF !important;
          background-color: rgba(15, 23, 42, 0.8) !important;
        }
        .chatgpt-got-it-button:hover {
          background-color: rgba(15, 23, 42, 0.9) !important;
        }
        .chatgpt-got-it-button * {
          color: #FFFFFF !important;
        }
        .chatgpt-got-it-button span {
          color: #FFFFFF !important;
        }
        /* Mobile browser specific styling */
        @media (max-width: 768px) {
          .chatgpt-modal-backdrop {
            align-items: flex-end !important;
            padding: 0 !important;
          }
          .chatgpt-modal-card {
            max-width: 100% !important;
            height: 90vh !important;
            max-height: 90vh !important;
            border-radius: 24px 24px 0 0 !important;
            animation: slideUpFromBottom 300ms cubic-bezier(0.16, 1, 0.3, 1) !important;
            display: flex;
            flex-direction: column;
          }
          .chatgpt-modal-content {
            overflow-y: auto;
            flex: 1;
          }
        }
        @keyframes slideUpFromBottom {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
      `}</style>

      <div 
        className="chatgpt-modal-backdrop fixed inset-0 flex items-center justify-center p-4 bg-black/60" 
        style={{ zIndex: 2147483647 }}
      >
        <div 
          className="chatgpt-modal-card w-full max-w-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden text-white relative"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.92) 50%, rgba(15, 23, 42, 0.95) 100%)',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 100px rgba(148, 163, 184, 0.15)'
          }}
        >
            <div className="relative px-5 py-4 border-b border-white/10 bg-white/5 flex-shrink-0">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 hover:bg-white/10 rounded-full transition-colors z-50 cursor-pointer"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <h2 className="text-xl font-semibold pr-8 text-white">
                {isMobile ? 'Magic ChatGPT Sync' : 'Connect ChatGPT'}
              </h2>
              <p className="text-sm mt-0.5 text-white">
                {isMobile ? 'Three quick steps to import your conversations' : 'Three quick steps to import your conversations'}
              </p>

              <div className="mt-3 flex items-start gap-2 bg-white/12 rounded-2xl px-3 py-2">
                <svg
                  className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-xs leading-relaxed text-white">
                  <strong className="font-semibold">Private &amp; secure.</strong>{' '}
                  We only access your chat history. No one else sees this data.
                </p>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4 chatgpt-modal-content">
              {isMobile ? (
                // Mobile View
                <>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="step-circle rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">1</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h3 className="text-sm font-semibold mb-1 text-white">
                        Copy the magic spell
                      </h3>
                      <button 
                        onClick={handleCopyCode}
                        className="mt-1 w-full flex items-center justify-center gap-2 py-3 bg-white/10 rounded-xl text-sm font-medium hover:bg-white/20 active:scale-95 transition-all text-emerald-300 border border-emerald-500/30"
                      >
                        {copied ? '✨ Spell Copied!' : '🔮 Copy Spell Code'}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-white/10 ml-10" />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="step-circle rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h3 className="text-sm font-semibold mb-1 text-white">
                        Create Magic Bookmark
                      </h3>
                      <p className="text-xs text-slate-200 leading-relaxed mb-2">
                        1. Tap Browser Menu (⋮ or Share)<br/>
                        2. Add Bookmark (call it "Magic")<br/>
                        3. Edit the bookmark & paste spell in URL
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/10 ml-10" />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="step-circle rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h3 className="text-sm font-semibold mb-1 text-white">
                        Cast Spell on ChatGPT
                      </h3>
                      <button
                        onClick={() => window.open('https://chatgpt.com', '_blank')}
                        className="mt-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                      >
                        Open ChatGPT ↗
                      </button>
                      <p className="text-xs text-slate-300 mt-2">
                        Type "Magic" in address bar & tap the bookmark!
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                // Desktop View (Original)
                <>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="step-circle rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">1</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h3 className="text-sm font-semibold mb-1 text-white">
                        Drag this button to your bookmarks bar
                      </h3>
                      <div className="relative inline-block mt-2">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{ animation: 'gentlePulse 2s ease-in-out infinite' }}
                        />
                        <a
                          href={bookmarkletHref}
                          title="✨ Onairos ChatGPT Sync"
                          draggable="true"
                          onDragStart={(e) => {
                            try {
                              e.dataTransfer.setData('text/uri-list', bookmarkletHref);
                              e.dataTransfer.setData('text/plain', bookmarkletHref);
                              e.dataTransfer.setData('text/x-moz-url', `${bookmarkletHref}\n✨ Onairos ChatGPT`);
                              e.dataTransfer.setData('DownloadURL', `application/javascript:✨ Onairos ChatGPT:${bookmarkletHref}`);
                              e.dataTransfer.effectAllowed = 'copy';
                              console.log('✅ Bookmarklet drag started with title: ✨ Onairos ChatGPT');
                            } catch (err) {
                              console.warn('Drag start error:', err);
                            }
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            alert('✨ Please drag this button to your bookmarks bar!\n\nTip: Press Ctrl+Shift+B (or Cmd+Shift+B on Mac) to show your bookmarks bar.');
                          }}
                          className="bookmarklet-button relative inline-flex items-center gap-1.5 px-4 py-2 font-medium cursor-move select-none transition-all hover:scale-[1.03]"
                          suppressHydrationWarning
                        >
                          <span className="text-base">✨</span>
                          <span className="text-sm">Onairos ChatGPT</span>
                        </a>
                      </div>
                      <p className="text-xs mt-2 text-slate-200">
                        <kbd className="px-1.5 py-0.5 bg-white/10 rounded-full text-[10px] font-mono border border-white/10 text-slate-50">
                          Ctrl+Shift+B
                        </kbd>{' '}
                        (or{' '}
                        <kbd className="px-1.5 py-0.5 bg-white/10 rounded-full text-[10px] font-mono border border-white/10 text-slate-50">
                          Cmd+Shift+B
                        </kbd>{' '}
                        on Mac) to show bookmarks bar
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/10 ml-10" />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="step-circle rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h3 className="text-sm font-semibold mb-1 text-white">
                        Open ChatGPT and log in
                      </h3>
                      <p className="text-xs mb-2 text-slate-200">
                        Make sure you're logged into your ChatGPT account
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          window.open('https://chat.openai.com', '_blank', 'noopener,noreferrer');
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          background: 'linear-gradient(135deg, #10a37f 0%, #0d9270 100%)',
                          color: '#ffffff',
                          boxShadow: '0 0 25px rgba(16, 163, 127, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        Open ChatGPT
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-white/10 ml-10" />

                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="step-circle rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h3 className="text-sm font-semibold mb-1 text-white">
                        Click the bookmark on ChatGPT
                      </h3>
                      <p className="text-xs text-slate-200">
                        Click the <strong className="text-white">&quot;Onairos ChatGPT&quot;</strong>{' '}
                        bookmark you added. We&apos;ll securely import your last 10 conversations.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-4 bg-white/5 border-t border-white/10 flex-shrink-0">
              <button
                type="button"
                onClick={handleGotIt}
                className="w-full px-4 py-2.5 rounded-full font-medium text-sm transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_10px_30px_rgba(15,23,42,0.45)] border border-white/40 chatgpt-got-it-button"
              >
                <span>{isMobile ? 'Close' : 'Got it! ✓'}</span>
              </button>
            </div>
          </div>
        </div>
    </div>,
    document.body
  );
}
