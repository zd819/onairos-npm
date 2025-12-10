import React from 'react';
import { createPortal } from 'react-dom';

const BOOKMARKLET_HREF =
  "javascript:(async()=>{let loader=null;function showLoader(msg){if(!loader){loader=document.createElement('div');loader.style.cssText='position:fixed;top:20px;right:20px;width:280px;background:rgba(15,23,42,0.95);color:white;padding:14px 20px;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif;font-size:13px;font-weight:500;z-index:999999;box-shadow:0 8px 24px rgba(0,0,0,0.4),0 2px 8px rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(12px);line-height:1.4;text-align:center';document.body.appendChild(loader)}loader.textContent=msg}function hideLoader(){if(loader){loader.remove();loader=null}}function h(){try{const e=window.location.hostname||'';return e==='chat.openai.com'||e==='chatgpt.com'||e.endsWith('.chatgpt.com')}catch{return false}}function getDeviceId(){try{const c=document.cookie.match(/oai-did=([^;]+)/);return c?c[1]:null}catch{return null}}async function getAccessToken(){const url=`${window.location.origin}/api/auth/session`;const r=await fetch(url,{method:'GET',credentials:'include',headers:{'Accept':'application/json','Referer':window.location.origin}});if(!r.ok)return null;const data=await r.json();return data?.accessToken||null}async function fetchList(token,deviceId){const url=`${window.location.origin}/backend-api/conversations?offset=0&limit=10`;const headers={'Accept':'*/*','oai-language':'en-US'};if(token)headers['Authorization']=`Bearer ${token}`;if(deviceId)headers['oai-device-id']=deviceId;const r=await fetch(url,{method:'GET',credentials:'include',headers});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}async function fetchConvo(id,token,deviceId){const url=`${window.location.origin}/backend-api/conversation/${id}`;const headers={'Accept':'*/*','oai-language':'en-US','Referer':window.location.origin};if(token)headers['Authorization']=`Bearer ${token}`;if(deviceId)headers['oai-device-id']=deviceId;const r=await fetch(url,{method:'GET',credentials:'include',headers});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}async function fetchMemories(token,deviceId){const url=`${window.location.origin}/backend-api/memories?include_memory_entries=true&memory_entries_filter=all`;const headers={'Accept':'application/json','Referer':window.location.origin};if(token)headers['Authorization']=`Bearer ${token}`;if(deviceId)headers['oai-device-id']=deviceId;try{const r=await fetch(url,{method:'GET',credentials:'include',headers});if(!r.ok)return null;return r.json()}catch{return null}}function extractUserMessages(data){const mapping=data?.mapping||{};const msgs=[];for(const node of Object.values(mapping)){const msg=node?.message;if(!msg||!msg.author)continue;if(msg.author.role!=='user')continue;const time=msg.create_time?new Date(msg.create_time*1000).toISOString():null;let text='';const content=msg.content||{};if(Array.isArray(content.parts)){text=content.parts.join('\\n').trim()}else if(content.text){text=content.text.trim()}if(text){msgs.push({content:text,timestamp:time})}}return msgs}async function sendToBackend(convos,memories){try{const userData=JSON.parse(localStorage.getItem('onairosUser')||'{}');const jwtToken=userData.token;if(!jwtToken){console.warn('[Onairos] No JWT token, skipping backend sync');return}const baseUrl='https://api2.onairos.uk';for(const c of convos){if(c.error)continue;const reqBody={platform:'web-chatgpt',conversationData:{conversationId:c.id,messages:c.messages.map((m,i)=>({id:`msg_${i}`,role:'user',content:m.content,timestamp:m.timestamp})),context:{title:c.title,url:c.url}},memoryType:'conversation'};await fetch(`${baseUrl}/llm-data/store`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${jwtToken}`},body:JSON.stringify(reqBody)})}if(memories){const memReq={platform:'web-chatgpt',memoriesData:memories,metadata:{source:'web-bookmarklet',fetchedAt:new Date().toISOString()}};await fetch(`${baseUrl}/llm-data/store-memories`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${jwtToken}`},body:JSON.stringify(memReq)})}console.log('✅ [Onairos] Synced to backend')}catch(e){console.warn('[Onairos] Backend sync failed:',e.message)}}if(!h()){alert('⚠️ Please open ChatGPT and try again.');return}showLoader('🚀 Starting export...');console.log('[Onairos] 🚀 Starting export...');try{showLoader('🔑 Getting access token...');const token=await getAccessToken();const deviceId=getDeviceId();if(!token){hideLoader();alert('⚠️ Could not get access token.\\n\\nMake sure you are logged into ChatGPT.');return}showLoader('📋 Fetching conversations...');let list;try{list=await fetchList(token,deviceId)}catch(err){hideLoader();alert('❌ Failed to fetch conversations: '+err.message);return}const items=(list?.items||[]).slice(0,10);if(items.length===0){hideLoader();alert('⚠️ No conversations found.');return}showLoader(`📥 Fetching ${items.length} conversations...`);const convos=[];for(let i=0;i<items.length;i++){const c=items[i];showLoader(`📥 ${i+1}/${items.length}: ${c.title||'Untitled'}...`);try{const data=await fetchConvo(c.id,token,deviceId);const userMsgs=extractUserMessages(data);convos.push({id:c.id,title:c.title||'Untitled',url:`${window.location.origin}/c/${c.id}`,messageCount:userMsgs.length,messages:userMsgs})}catch(err){convos.push({id:c.id,title:c.title||'Untitled',error:err.message})}}showLoader('🧠 Fetching memories...');const memories=await fetchMemories(token,deviceId);showLoader('💾 Saving to backend...');await sendToBackend(convos,memories);const output={exportedAt:new Date().toISOString(),totalConversations:convos.length,conversations:convos,memories:memories||{}};const totalMsgs=convos.reduce((sum,r)=>sum+(r.messageCount||0),0);const memCount=memories?((memories.memories||[]).length||(memories.items||[]).length+(memories.memory_entries||[]).length):0;hideLoader();alert(`✅ Synced to Onairos!\\n\\n📊 ${convos.length} conversations\\n💬 ${totalMsgs} user messages\\n🧠 ${memCount} memories`);console.log('\\n✅ Export complete!',output)}catch(e){hideLoader();alert('❌ Error: '+e.message);console.error(e)}})();";

export const getOnairosChatGPTBookmarklet = () => BOOKMARKLET_HREF;

export default function ConnectChatGPTModal({ open, onClose, onConnected }) {
  // Debug log to confirm render attempt
  if (open) {
    console.log('🚀 ConnectChatGPTModal rendering! Open:', open);
  }

  if (!open) return null;

  const bookmarkletHref = BOOKMARKLET_HREF;

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
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(148, 163, 184, 0.35);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(148, 163, 184, 0);
          }
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
            border-radius: 24px 24px 0 0 !important;
            animation: slideUpFromBottom 300ms cubic-bezier(0.16, 1, 0.3, 1) !important;
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
            <div className="relative px-5 py-4 border-b border-white/10 bg-white/5">
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
                Connect ChatGPT
              </h2>
              <p className="text-sm mt-0.5 text-white">
                Three quick steps to import your conversations
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

            <div className="px-5 py-4 space-y-4">
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
                      href="#onairos-chatgpt-bookmarklet"
                      title="✨ Onairos ChatGPT"
                      draggable="true"
                      onDragStart={(e) => {
                        try {
                          // Pass the bookmarklet code via drag data
                          e.dataTransfer.setData('text/plain', bookmarkletHref);
                          e.dataTransfer.setData('text/uri-list', bookmarkletHref);
                          // Also set the bookmark title explicitly
                          e.dataTransfer.setData('text/x-moz-url', `${bookmarkletHref}\n✨ Onairos ChatGPT`);
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
            </div>

            <div className="px-5 py-4 bg-white/5 border-t border-white/10">
              <button
                type="button"
                onClick={handleGotIt}
                className="w-full px-4 py-2.5 rounded-full font-medium text-sm transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_10px_30px_rgba(15,23,42,0.45)] border border-white/40 chatgpt-got-it-button"
              >
                <span>Got it! ✓</span>
              </button>
            </div>
          </div>
        </div>
    </div>,
    document.body
  );
}


