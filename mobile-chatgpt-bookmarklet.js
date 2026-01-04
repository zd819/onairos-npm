// Onairos Mobile ChatGPT Scraper
// This script is designed to be run as a bookmarklet on mobile browsers.
// It scrapes the last 10 conversations and displays them in an overlay.

(async () => {
  // 1. Helper to create/update overlay
  let overlay = document.getElementById('onairos-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'onairos-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.98);
      color: #ECECEC;
      z-index: 9999999;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 20px;
      box-sizing: border-box;
      overflow: hidden;
    `;
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-shrink: 0;';
    header.innerHTML = `
      <h2 style="margin: 0; font-size: 18px; font-weight: 600;">✨ Onairos Mobile Export</h2>
      <button id="onairos-close" style="background: transparent; border: none; color: #94a3b8; font-size: 24px; padding: 5px;">&times;</button>
    `;
    overlay.appendChild(header);

    // Status area
    const status = document.createElement('div');
    status.id = 'onairos-status';
    status.style.cssText = 'font-size: 14px; color: #10b981; margin-bottom: 10px; font-weight: 500; min-height: 20px;';
    status.textContent = 'Initializing...';
    overlay.appendChild(status);

    // Content area (Textarea for easy copying)
    const content = document.createElement('textarea');
    content.id = 'onairos-content';
    content.style.cssText = `
      flex: 1;
      width: 100%;
      background: #1e293b;
      color: #e2e8f0;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      resize: none;
      margin-bottom: 15px;
    `;
    content.readOnly = true;
    content.placeholder = 'Data will appear here...';
    overlay.appendChild(content);

    // Actions
    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 10px; flex-shrink: 0;';
    
    const copyBtn = document.createElement('button');
    copyBtn.id = 'onairos-copy';
    copyBtn.textContent = '📋 Copy Data';
    copyBtn.style.cssText = `
      flex: 1;
      background: #10b981;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
    `;
    actions.appendChild(copyBtn);

    overlay.appendChild(actions);
    document.body.appendChild(overlay);

    // Event listeners
    document.getElementById('onairos-close').onclick = () => overlay.remove();
    document.getElementById('onairos-copy').onclick = () => {
      const el = document.getElementById('onairos-content');
      el.select();
      el.setSelectionRange(0, 99999); // For mobile
      document.execCommand('copy'); // Fallback
      navigator.clipboard.writeText(el.value).then(() => {
        document.getElementById('onairos-status').textContent = '✅ Copied to clipboard!';
      }).catch(() => {
        document.getElementById('onairos-status').textContent = '❌ Copy failed. Please select text manually.';
      });
    };
  }

  const updateStatus = (msg) => {
    const el = document.getElementById('onairos-status');
    if (el) el.textContent = msg;
  };

  const setContent = (text) => {
    const el = document.getElementById('onairos-content');
    if (el) el.value = text;
  };

  // 2. Logic checks
  const hostname = window.location.hostname || '';
  if (hostname !== 'chat.openai.com' && hostname !== 'chatgpt.com' && !hostname.endsWith('.chatgpt.com')) {
    updateStatus('❌ Error: Please run this on chatgpt.com');
    alert('⚠️ Please open ChatGPT (chatgpt.com) and run this bookmarklet again.');
    return;
  }

  // 3. API Helpers
  async function getAccessToken() {
    try {
      const url = `${window.location.origin}/api/auth/session`;
      const r = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json', 'Referer': window.location.origin }
      });
      if (!r.ok) return null;
      const data = await r.json();
      return data?.accessToken || null;
    } catch (e) { return null; }
  }

  function getDeviceId() {
    try {
      const c = document.cookie.match(/oai-did=([^;]+)/);
      return c ? c[1] : null;
    } catch { return null; }
  }

  async function fetchList(token, deviceId) {
    const url = `${window.location.origin}/backend-api/conversations?offset=0&limit=10`; // Limit to 10 for speed
    const headers = { 'Accept': '*/*', 'oai-language': 'en-US' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (deviceId) headers['oai-device-id'] = deviceId;
    const r = await fetch(url, { method: 'GET', credentials: 'include', headers });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  async function fetchConvo(id, token, deviceId) {
    const url = `${window.location.origin}/backend-api/conversation/${id}`;
    const headers = { 'Accept': '*/*', 'oai-language': 'en-US', 'Referer': window.location.origin };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (deviceId) headers['oai-device-id'] = deviceId;
    const r = await fetch(url, { method: 'GET', credentials: 'include', headers });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  function extractUserMessages(data) {
    const mapping = data?.mapping || {};
    const msgs = [];
    for (const node of Object.values(mapping)) {
      const msg = node?.message;
      if (!msg || !msg.author) continue;
      // We want both user and assistant for context usually, but the original only took user?
      // Let's stick to the original logic which seemed to focus on user messages or maybe I should capture all.
      // The original code: if (msg.author.role !== 'user') continue;
      // Let's capture assistant too for better data, but label them.
      // Actually, sticking to original for now to ensure compatibility.
      // Wait, original logic:
      /*
      if(msg.author.role!=='user')continue;
      */
      // I will capture both for better utility since we are just printing.
      
      const role = msg.author.role;
      if (role === 'system') continue; 

      const time = msg.create_time ? new Date(msg.create_time * 1000).toISOString() : null;
      let text = '';
      const content = msg.content || {};
      if (Array.isArray(content.parts)) {
        text = content.parts.join('\n').trim();
      } else if (content.text) {
        text = content.text.trim();
      }
      
      if (text) {
        msgs.push({ role, content: text, timestamp: time });
      }
    }
    // Sort by timestamp if needed, but mapping usually is not ordered. 
    // Usually need to traverse the tree. But for simple dump:
    return msgs.sort((a,b) => (a.timestamp > b.timestamp) ? 1 : -1);
  }

  // 4. Main Execution
  try {
    updateStatus('🔑 Authenticating...');
    const token = await getAccessToken();
    const deviceId = getDeviceId();

    if (!token) {
      updateStatus('❌ Not logged in. Please log in to ChatGPT.');
      return;
    }

    updateStatus('📋 Fetching conversation list...');
    const list = await fetchList(token, deviceId);
    const items = (list?.items || []).slice(0, 5); // Limit to 5 for mobile performance demo

    if (items.length === 0) {
      updateStatus('⚠️ No conversations found.');
      return;
    }

    const fullData = {
      exportedAt: new Date().toISOString(),
      conversations: []
    };

    for (let i = 0; i < items.length; i++) {
      const c = items[i];
      updateStatus(`📥 Fetching ${i + 1}/${items.length}: ${c.title || 'Untitled'}...`);
      
      try {
        const convoData = await fetchConvo(c.id, token, deviceId);
        const messages = extractUserMessages(convoData);
        fullData.conversations.push({
          id: c.id,
          title: c.title || 'Untitled',
          create_time: c.create_time,
          messages: messages
        });
      } catch (err) {
        console.error(err);
      }
    }

    updateStatus('✅ Done! You can now copy the data.');
    setContent(JSON.stringify(fullData, null, 2));

  } catch (err) {
    updateStatus('❌ Error: ' + err.message);
    console.error(err);
  }

})();

