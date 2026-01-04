# Mobile ChatGPT Data Scraper Setup

This guide explains how to set up the Onairos data scraper on your mobile device (iOS/Android). This allows you to extract your ChatGPT history directly from your phone's browser.

## 📱 iOS (Safari)

1.  **Copy the Code**: Copy the entire code block below.
2.  **Add Bookmark**: Open Safari and tap the Share button, then "Add Bookmark". Name it "✨ Scrape ChatGPT" and save it.
3.  **Edit Address**:
    *   Open your Bookmarks (book icon).
    *   Tap "Edit" in the bottom corner.
    *   Tap the "✨ Scrape ChatGPT" bookmark you just created.
    *   Delete the current address (URL).
    *   **Paste the code** you copied into the address field.
    *   Tap "Done".

## 🤖 Android (Chrome)

1.  **Copy the Code**: Copy the entire code block below.
2.  **Add Bookmark**: Tap the menu (⋮) -> Star icon (⭐) to bookmark the current page.
3.  **Edit Bookmark**:
    *   Tap "Edit" at the bottom snackbar (or go to Bookmarks -> Edit).
    *   Change the Name to "✨ Scrape ChatGPT".
    *   Delete the URL.
    *   **Paste the code** you copied into the URL field.
    *   Save it.

## 🚀 How to Use

1.  Open **[chatgpt.com](https://chatgpt.com)** in your mobile browser and log in.
2.  **Run the Bookmarklet**:
    *   **iOS**: Tap the address bar, type "Scrape" (start of your bookmark name), and tap the bookmark in the "Bookmarks and History" section.
    *   **Android**: Tap the address bar, type "Scrape", and tap the star/bookmark suggestion.
3.  An overlay will appear showing the scraping progress.
4.  Once finished, the data will appear in the text box.
5.  Tap **"Copy Data"** to copy the JSON to your clipboard.

---

## 📋 The Code (Copy All)

```javascript
javascript:(async()=>{let overlay=document.getElementById('onairos-overlay');if(!overlay){overlay=document.createElement('div');overlay.id='onairos-overlay';overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.98);color:#ECECEC;z-index:9999999;display:flex;flex-direction:column;font-family:system-ui,sans-serif;padding:20px;box-sizing:border-box;overflow:hidden;';const header=document.createElement('div');header.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;flex-shrink:0;';header.innerHTML='<h2 style=margin:0;font-size:18px;font-weight:600>✨ Onairos Mobile</h2><button id=onairos-close style=background:transparent;border:none;color:#94a3b8;font-size:24px;padding:5px>&times;</button>';overlay.appendChild(header);const status=document.createElement('div');status.id='onairos-status';status.style.cssText='font-size:14px;color:#10b981;margin-bottom:10px;font-weight:500;min-height:20px;';status.textContent='Initializing...';overlay.appendChild(status);const content=document.createElement('textarea');content.id='onairos-content';content.style.cssText='flex:1;width:100%;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:12px;font-family:monospace;font-size:12px;resize:none;margin-bottom:15px;';content.readOnly=true;content.placeholder='Data will appear here...';overlay.appendChild(content);const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;flex-shrink:0;';const copyBtn=document.createElement('button');copyBtn.id='onairos-copy';copyBtn.textContent='📋 Copy Data';copyBtn.style.cssText='flex:1;background:#10b981;color:white;border:none;padding:12px;border-radius:8px;font-weight:600;font-size:16px;';actions.appendChild(copyBtn);overlay.appendChild(actions);document.body.appendChild(overlay);document.getElementById('onairos-close').onclick=()=>overlay.remove();document.getElementById('onairos-copy').onclick=()=>{const el=document.getElementById('onairos-content');el.select();el.setSelectionRange(0,99999);document.execCommand('copy');navigator.clipboard.writeText(el.value).then(()=>{document.getElementById('onairos-status').textContent='✅ Copied!'}).catch(()=>{document.getElementById('onairos-status').textContent='❌ Copy failed'})}}const updateStatus=(msg)=>{const el=document.getElementById('onairos-status');if(el)el.textContent=msg};const setContent=(text)=>{const el=document.getElementById('onairos-content');if(el)el.value=text};if(!window.location.hostname.includes('chatgpt.com')&&!window.location.hostname.includes('openai.com')){alert('⚠️ Please open ChatGPT (chatgpt.com)');return}async function getAccessToken(){try{const r=await fetch('/api/auth/session');if(!r.ok)return null;return(await r.json())?.accessToken}catch{return null}}async function fetchList(t){const r=await fetch('/backend-api/conversations?offset=0&limit=5',{headers:{'Authorization':`Bearer ${t}`}});return r.json()}async function fetchConvo(id,t){const r=await fetch(`/backend-api/conversation/${id}`,{headers:{'Authorization':`Bearer ${t}`}});return r.json()}try{updateStatus('🔑 Auth...');const t=await getAccessToken();if(!t){updateStatus('❌ Not logged in');return}updateStatus('📋 Fetching...');const l=await fetchList(t);const items=(l?.items||[]).slice(0,5);const allData={exportedAt:new Date().toISOString(),conversations:[]};for(const item of items){updateStatus(`📥 ${item.title?item.title.substring(0,15):'Untitled'}...`);try{const d=await fetchConvo(item.id,t);allData.conversations.push(d)}catch(e){console.error(e)}}setContent(JSON.stringify(allData,null,2));updateStatus('✅ Done!')}catch(e){updateStatus('❌ '+e.message)}})();
```

