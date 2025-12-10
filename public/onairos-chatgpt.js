(function () {
  const GLOBAL_FN_NAME = '__onairosConnect';

  /**
   * Simple domain guard: ensure we're on ChatGPT / OpenAI chat.
   */
  function isChatGPTDomain() {
    try {
      const host = window.location.hostname || '';
      return (
        host === 'chat.openai.com' ||
        host === 'chatgpt.com' ||
        host.endsWith('.chatgpt.com')
      );
    } catch (_) {
      return false;
    }
  }

  /**
   * Get the base URL for ChatGPT API based on current origin.
   */
  function getBaseUrl() {
    const origin = window.location.origin;
    // If we're on chatgpt.com, use the current origin to avoid CORS
    if (origin.includes('chatgpt.com')) {
      return origin;
    }
    // Otherwise default to chat.openai.com
    return 'https://chat.openai.com';
  }

  /**
   * Fetch JSON with credentials included and basic error handling.
   */
  async function fetchJson(url) {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json, text/plain, */*',
      },
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error('AUTH_REQUIRED');
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error('REQUEST_FAILED');
      err.status = res.status;
      err.body = text;
      throw err;
    }

    return res.json();
  }

  /**
   * Extract user messages from a ChatGPT conversation payload.
   */
  function extractUserMessagesFromConversation(conversation) {
    const mapping = conversation && conversation.mapping ? conversation.mapping : {};
    const nodes = Object.values(mapping || {});

    const userMessages = [];

    for (const node of nodes) {
      const message = node && node.message;
      if (!message || !message.author) continue;

      const role = message.author.role;
      if (role !== 'user') continue;

      const createdAt =
        typeof message.create_time === 'number'
          ? new Date(message.create_time * 1000).toISOString()
          : message.create_time || null;

      let text = '';
      const content = message.content || {};

      if (Array.isArray(content.parts)) {
        text = content.parts.join('\n').trim();
      } else if (typeof content.text === 'string') {
        text = content.text.trim();
      } else if (content.content_type === 'text' && typeof content.text === 'string') {
        text = content.text.trim();
      }

      userMessages.push({
        id: message.id,
        createdAt,
        role,
        content: text,
      });
    }

    return userMessages;
  }

  /**
   * Get access token from ChatGPT's auth session endpoint.
   */
  async function getAccessToken() {
    try {
      const baseUrl = getBaseUrl();
      const url = `${baseUrl}/api/auth/session`;
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Referer': baseUrl
        }
      });
      
      if (!res.ok) {
        console.warn('[Onairos ChatGPT] Failed to fetch session:', res.status);
        return null;
      }
      
      const data = await res.json();
      return data?.accessToken || null;
    } catch (err) {
      console.error('[Onairos ChatGPT] Error getting access token:', err);
      return null;
    }
  }
  
  /**
   * Get device ID from cookies.
   */
  function getDeviceId() {
    try {
      const match = document.cookie.match(/oai-did=([^;]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Main exported function: fetch conversations using auth session.
   */
  async function onairosConnect() {
    if (!isChatGPTDomain()) {
      alert('⚠️ Please open ChatGPT (chatgpt.com) and click this bookmark again.');
      return;
    }

    console.log('[Onairos] 🚀 Starting export...');
    console.log('[Onairos] Step 1: Getting access token...');
    
    const accessToken = await getAccessToken();
    const deviceId = getDeviceId();
    
    console.log('[Onairos] Auth:', accessToken ? '✓ Found' : '✗ Not found');
    console.log('[Onairos] Device:', deviceId ? '✓ Found' : '✗ Not found');
    
    if (!accessToken) {
      alert('⚠️ Could not get access token.\n\nMake sure you are logged into ChatGPT and try again.');
      return;
    }

    console.log('[Onairos] Step 2: Fetching conversation list...');

    const baseUrl = getBaseUrl();
    let conversationsPayload;
    
    try {
      const url = `${baseUrl}/backend-api/conversations?offset=0&limit=10`;
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${accessToken}`,
          'oai-language': 'en-US',
          'oai-device-id': deviceId || '',
          'Referer': baseUrl
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      conversationsPayload = await res.json();
    } catch (err) {
      console.error('[Onairos ChatGPT] Failed to fetch conversations:', err);
      alert('❌ Failed to fetch conversations: ' + err.message);
      return;
    }

    const items = conversationsPayload && Array.isArray(conversationsPayload.items)
      ? conversationsPayload.items.slice(0, 10)
      : [];

    if (items.length === 0) {
      alert('⚠️ No conversations found in your account.');
      return;
    }

    console.log(`[Onairos] Step 3: Fetching ${items.length} conversation details...`);

    const results = [];

    for (const conv of items) {
      const id = conv && conv.id;
      if (!id) continue;
      
      const title = conv.title || 'Untitled';
      console.log(`  → ${title}...`);

      let detail;
      try {
        const url = `${baseUrl}/backend-api/conversation/${encodeURIComponent(id)}`;
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': '*/*',
            'Authorization': `Bearer ${accessToken}`,
            'oai-language': 'en-US',
            'oai-device-id': deviceId || '',
            'Referer': baseUrl
          }
        });
        
        if (!res.ok) {
          console.warn(`    ✗ HTTP ${res.status}`);
          continue;
        }
        
        detail = await res.json();
      } catch (err) {
        console.warn(`    ✗ ${err.message}`);
        continue;
      }

      const userMessages = extractUserMessagesFromConversation(detail);

      results.push({
        conversationId: id,
        title: title,
        createdAt:
          detail.create_time != null
            ? new Date(detail.create_time * 1000).toISOString()
            : null,
        url: `${baseUrl}/c/${id}`,
        messageCount: userMessages.length,
        userMessages,
      });
      
      console.log(`    ✓ ${userMessages.length} messages`);
    }

    const totalMessages = results.reduce((sum, conv) => sum + conv.userMessages.length, 0);

    const output = {
      exportedAt: new Date().toISOString(),
      totalConversations: results.length,
      conversations: results
    };

    console.log('\n✅ Export complete!');
    console.log(JSON.stringify(output, null, 2));
    
    // Download as JSON file
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `chatgpt-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    
    alert('✅ Successfully exported ' + results.length + ' conversations!\n\nTotal messages: ' + totalMessages + '\n\n💾 JSON file downloaded\n🔍 Check console for details');
  }

  // Expose on window for bookmarklet usage.
  try {
    Object.defineProperty(window, GLOBAL_FN_NAME, {
      value: onairosConnect,
      writable: false,
      configurable: true,
    });
  } catch (_) {
    // Fallback if defineProperty fails for any reason
    window[GLOBAL_FN_NAME] = onairosConnect;
  }
})();


