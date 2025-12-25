# ✅ getAPIurlMobile - POST Method Verification

## Summary

**ALL instances of `/getAPIurlMobile` endpoint calls use POST method (not GET).**

If you're seeing GET errors in backend logs, they are **NOT** coming from this endpoint in the frontend code.

---

## 🔍 Verification Results

### Instance 1: `src/onairosButton.jsx` (Line 1145) ✅

**Location:** Main data request handler  
**Method:** POST ✅

```javascript
const urlResponse = await fetch('https://api2.onairos.uk/getAPIurlMobile', {
  method: 'POST',  // ✅ POST method confirmed
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    Info: {
      appId: webpageName,
      account: accountIdentifier,
      confirmations: requestResult.approved.map(id => ({ 
        data: id === 'personality' ? 'Large' : id === 'basic' ? 'Basic' : id 
      })),
      EncryptedUserPin: userData?.EncryptedUserPin || 'pending_pin_integration',
      storage: 's3',
      proofMode: proofMode
    }
  })
});
```

---

### Instance 2: `src/iframe/dataRequestHandler.js` (Line 625) ✅

**Location:** iFrame data request handler  
**Method:** POST ✅

```javascript
const response = await fetch(endpoint, {
  method: 'POST',  // ✅ POST method confirmed
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestBody)
});

// Where endpoint is either:
// - 'https://api2.onairos.uk/inferenceTest' (test mode)
// - apiUrl parameter (defaults to 'https://api2.onairos.uk/getAPIurlMobile')
```

**Request Body Format:**
```javascript
{
  Info: {
    storage: "local",
    appId: appName,
    confirmations: confirmations,
    EncryptedUserPin: "pending_pin_integration",
    account: userEmail,
    proofMode: false,
    Domain: window.location.hostname,
    web3Type: "standard",
    OthentSub: null
  }
}
```

---

### Instance 3: Documentation Examples ✅

**File:** `SDK_QUICK_REFERENCE.md`

All documentation examples show POST method:

```http
POST /getAPIurlMobile
{
  "Info": {
    "storage": "local",
    "appId": "your_app_id",
    "confirmations": [{"data": "Large", "date": "2024-01-15T10:30:00Z"}],
    "EncryptedUserPin": "encrypted_pin_data",
    "account": "user123",
    "proofMode": false
  }
}
```

---

## 📋 All getAPIurlMobile References

| File | Line | Method | Status |
|------|------|--------|--------|
| `src/onairosButton.jsx` | 1145 | POST | ✅ |
| `src/iframe/dataRequestHandler.js` | 564 (default), 625 (fetch) | POST | ✅ |
| `src/mobile/MobileDataRequestPage.jsx` | 68 (reference only) | N/A | - |
| `SDK_QUICK_REFERENCE.md` | 150, 318 | POST | ✅ |
| `docs/DATA_FREQUENCY.md` | 16, 26, 37 | POST | ✅ |

---

## 🎯 Conclusion

**VERIFIED: All `/getAPIurlMobile` calls use POST method.**

### If Backend Shows GET Errors:

The GET requests are **NOT** coming from:
- ❌ `/getAPIurlMobile` endpoint calls
- ❌ Frontend SDK code
- ❌ Data request handlers

### Possible Sources of GET Errors:

1. **Browser Preflight/Checks:**
   - Browser navigation to URLs
   - CORS preflight (OPTIONS, not GET)
   - Favicon requests
   - Asset requests

2. **Health Checks:**
   - Load balancer health checks
   - Monitoring services
   - Status page pings

3. **Other Endpoints:**
   - Different API endpoints
   - Static asset requests
   - Documentation pages

4. **Third-party Services:**
   - Analytics requests
   - CDN requests
   - External integrations

---

## 🔍 How to Identify GET Error Source

Check your backend logs for:

```bash
# Look for the full URL path of GET requests
GET /some-path HTTP/1.1

# Check User-Agent header
User-Agent: Mozilla/5.0 ...  # Browser navigation
User-Agent: ELB-HealthChecker  # Load balancer
User-Agent: axios/...  # HTTP client library
```

Common GET endpoints in Onairos backend:
- `/health` - Health check endpoint
- `/status` - Status endpoint
- `/` - Root endpoint
- Static assets (images, CSS, JS)

---

## ✅ Summary

**All `/getAPIurlMobile` calls in the frontend code use POST method.**

If you're seeing GET errors for this endpoint, they might be:
1. **Browser auto-navigation** (user pasting URL)
2. **External monitoring** (health checks, uptime monitors)
3. **Documentation/testing tools** (Postman, curl with wrong method)
4. **Logs from different endpoint** (check the full path)

**NOT from the Onairos SDK frontend code** ✅

---

## 📞 Next Steps

1. **Check backend logs** for full request details:
   - Full URL path
   - User-Agent header
   - Referrer header
   - IP address

2. **Verify endpoint:**
   - Is it actually `/getAPIurlMobile`?
   - Or a different endpoint?

3. **Check request source:**
   - Frontend SDK? (Should be POST)
   - Browser navigation? (Would be GET)
   - External tool? (Depends on configuration)

---

**Confirmed: Frontend SDK only makes POST requests to `/getAPIurlMobile`** ✅

