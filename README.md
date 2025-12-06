## Onairos Developer Documentation v2.0.0

### 🚀 What's New in v2.0.0

- **Popup-based Data Requests**: No more cutoff issues with improved popup window implementation
- **AutoFetch by Default**: Automatic API calls after user approval - no manual handling required
- **Simplified Integration**: Much cleaner and easier to use
- **Enhanced UX**: Better positioning, loading states, and error handling
- **Laravel Vite Support**: First-class integration with Laravel Vite applications

### 1. Create a Developer Account

Create a Developer account to access Onairos services at:

https://Onairos.uk/dev-board

**Important:** Once you have a developer account and API key, domain registration is handled manually by the Onairos team. If you don't have an API key yet, you'll need to register your domain through the developer portal for secure API access.

### 2. Installation

#### Standard Installation

```bash
npm install onairos
```

#### Laravel Vite Installation

```bash
npm install onairos
# For Vue.js integration
npm install --save-dev @vitejs/plugin-vue
# For React integration
npm install --save-dev @vitejs/plugin-react
```

### 3. Basic Usage

#### React/Standard Integration

Import and use the OnairosButton component:

```jsx
import { OnairosButton } from "onairos";

function MyApp() {
  return (
    <OnairosButton
      requestData={["email", "profile", "social"]}
      webpageName="My Application"
      autoFetch={true} // Default - automatically makes API calls
      onComplete={(result) => {
        console.log("Data approved:", result.approved);
        console.log("API Response:", result.apiResponse); // Available when autoFetch is true

        if (result.apiResponse) {
          // Use the API response data directly
          console.log("User data:", result.apiResponse);
        }
      }}
    />
  );
}
```

#### Laravel Blade Integration

For Laravel applications using Blade templates:

```js
// vite.config.js
import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import { onairosLaravelPlugin } from "onairos/vite-plugin";

export default defineConfig({
  plugins: [
    laravel({
      input: ["resources/css/app.css", "resources/js/app.js"],
      refresh: true,
    }),
    onairosLaravelPlugin({
      bladeSupport: true,
    }),
  ],
});
```

```js
// resources/js/app.js
import { initializeOnairosForBlade } from "onairos/blade";

document.addEventListener("DOMContentLoaded", () => {
  initializeOnairosForBlade({
    testMode: import.meta.env.DEV,
    autoDetectMobile: true,
  });
});
```

```blade
{{-- resources/views/dashboard.blade.php --}}
<div id="onairos-button"></div>

<script>
createOnairosButton('onairos-button', {
    requestData: ['email', 'profile'],
    webpageName: 'My Laravel App',
    onComplete: function(result) {
        console.log('Connection successful!', result);
    }
});
</script>
```

#### Laravel Vue Integration

For Laravel applications using Vue.js:

```js
// vite.config.js
import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import vue from "@vitejs/plugin-vue";
import { onairosVuePlugin } from "onairos/vite-plugin";

export default defineConfig({
  plugins: [
    laravel({
      input: ["resources/css/app.css", "resources/js/app.js"],
      refresh: true,
    }),
    vue(),
    onairosVuePlugin(),
  ],
});
```

```js
// resources/js/app.js
import { createApp } from "vue";
import OnairosVue from "onairos/src/laravel/OnairosVue.vue";

const app = createApp({});
app.component("onairos-button", OnairosVue);
app.mount("#app");
```

#### Vite Optimization Configuration

For Vite applications, add the following configuration to ensure proper asset handling:

```ts
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["onairos"],
  },
});
```

#### Capacitor Mobile App Integration (React Native, iOS, Android)

For mobile applications using Capacitor with React + Vite:

```jsx
// Works identically to web - no special configuration needed
import { OnairosButton } from "onairos";

function MyMobileApp() {
  return (
    <OnairosButton
      requestData={["email", "profile", "social"]}
      webpageName="My Mobile App"
      autoFetch={true}
      onComplete={(result) => {
        if (result.apiResponse) {
          // Handle user data in your mobile app
          console.log("User data:", result.apiResponse);
        }
      }}
    />
  );
}
```

**Mobile-Specific Notes:**
- ✅ All React components work identically in Capacitor
- ✅ API calls and authentication work the same
- ✅ OAuth flows automatically use mobile-friendly redirects instead of popups
- ✅ Touch interactions are fully supported
- ✅ **LLM data collection available via native method** (no browser extension needed)
- 📱 Tested on iOS 13+ and Android 8+

**LLM Data Collection in Capacitor:**
```jsx
import { storeCapacitorLLMData } from 'onairos';

// Store LLM conversation data directly (no browser extension needed)
const result = await storeCapacitorLLMData(
  {
    messages: [
      { role: 'user', content: 'Hello!' },
      { role: 'assistant', content: 'Hi there!' }
    ],
    timestamp: new Date().toISOString()
  },
  userInfo, // From OnairosButton onComplete callback
  'chatgpt' // Platform: 'chatgpt', 'claude', 'gemini', or 'grok'
);
```

For detailed Capacitor integration including LLM data collection, see:
- 🚀 [Capacitor Quick Start Guide](./CAPACITOR_QUICK_START.md) - 5-minute setup
- 📖 [Full Capacitor Integration Guide](./CAPACITOR_IOS_INTEGRATION.md) - Complete documentation

#### Custom Persona Images

The library includes default persona images that change based on connected platforms. In Vite dev environments, these may show as gradient fallbacks due to asset processing. To use custom images:

```jsx
import { OnairosButton } from "onairos";

function MyApp() {
  return (
    <OnairosButton
      requestData={["email", "profile", "social"]}
      webpageName="My Application"
      personaImages={{
        1: "/path/to/persona1.png",
        2: "/path/to/persona2.png",
        3: "/path/to/persona3.png",
        4: "/path/to/persona4.png",
        5: "/path/to/persona5.png",
      }}
      onComplete={(result) => {
        console.log("Data approved:", result.approved);
      }}
    />
  );
}
```

```blade
{{-- In your Blade template --}}
<div id="app">
    <onairos-button
        :request-data="['email', 'profile']"
        webpage-name="Laravel Vue App"
        @complete="handleComplete"
    ></onairos-button>
</div>
```

### 4. Configuration Options

#### OnairosButton Props

- **`requestData`** (Array): Specific data types to request
  - Available types: `'email'`, `'profile'`, `'social'`, `'activity'`, `'preferences'`
- **`webpageName`** (String): Your application name displayed to users
- **`autoFetch`** (Boolean, default: `true`): Enable automatic API calls after approval
- **`onComplete`** (Function): Callback when data request completes
- **`proofMode`** (Boolean, default: `false`): Enable proof mode for verification
- **`testMode`** (Boolean, default: `false`): Enable test mode for development

#### Laravel-Specific Props

- **`buttonType`** (String): `'pill'`, `'icon'`, or `'rounded'`
- **`size`** (String): `'small'`, `'medium'`, or `'large'`
- **`textColor`** (String): Button text color
- **`disabled`** (Boolean): Disable the button

### 5. Laravel Integration Guide

For complete Laravel integration examples and advanced configuration, see our [Laravel Integration Guide](./LARAVEL_INTEGRATION_GUIDE.md).

The guide covers:

- ✅ **Blade Templates**: Direct integration with PHP templates
- ✅ **Vue.js Components**: Reactive Vue components
- ✅ **React Components**: React integration patterns
- ✅ **Vite Plugins**: Custom Vite plugins for Laravel
- ✅ **Mobile Optimization**: Automatic mobile detection
- ✅ **Production Deployment**: Build and deployment strategies

### 6. Migration from v1.x

**Before (v1.x - Complex)**:

```jsx
// Old complex setup with manual event listeners
useEffect(() => {
  const handleMessage = (event) => {
    if (
      event.data?.source === "content-script" &&
      event.data?.type === "API_URL_RESPONSE"
    ) {
      const { APIurl, accessToken } = event.data;
      // Manual API call handling
      fetch(APIurl, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(InputData),
      });
    }
  };
  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, []);

<Onairos requestData={complexRequestObject} webpageName={webpageName} />;
```

**After (v2.0 - Simple)**:

```jsx
// New simplified approach
<OnairosButton
  requestData={["email", "profile"]}
  webpageName="My App"
  onComplete={(result) => {
    // API call already made automatically
    console.log("User data:", result.apiResponse);
  }}
/>
```

### 7. Data Types Available

- **`email`**: Email address for account identification
- **`profile`**: Basic profile information and preferences
- **`social`**: Connected social media accounts
- **`activity`**: Usage patterns and interactions
- **`preferences`**: User settings and customization choices

### 8. Error Handling

The component includes comprehensive error handling:

```jsx
<OnairosButton
  requestData={["email"]}
  webpageName="My App"
  onComplete={(result) => {
    if (result.apiError) {
      console.error("API Error:", result.apiError);
      // Handle error appropriately
    } else if (result.apiResponse) {
      console.log("Success:", result.apiResponse);
      // Process data
    }
  }}
/>
```

### 9. Browser & Platform Compatibility

**Desktop Browsers:**
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

**Mobile Browsers:**
- ✅ iOS Safari 13+
- ✅ Chrome Mobile (Android)
- ✅ Samsung Internet
- ✅ Firefox Mobile

**Mobile Frameworks:**
- ✅ Capacitor (iOS/Android)
- ✅ React Native WebView
- ✅ Ionic

### 10. Troubleshooting

**Popup Blocked**: Ensure popups are allowed for your domain in browser settings. On mobile devices, OAuth automatically uses redirects instead of popups.

**API Calls Failing**: 
- If you have a developer account with an API key, domain registration is handled manually by the Onairos team
- If you don't have an API key, verify your domain is registered in the [developer console](https://Onairos.uk/dev-board)
- Check that your API key is included in requests if using the SDK

**Data Not Loading**: Check browser console for errors and ensure proper integration.

**Mobile/Capacitor Issues**: 
- OAuth popups automatically convert to redirects on mobile
- Browser extension features are not available in Capacitor apps
- Ensure localStorage is enabled in your Capacitor configuration

### 11. Support

For issues or questions:

- Check the [troubleshooting guide](./POPUP_IMPLEMENTATION_README.md)
- Review browser console for errors
- Contact support with detailed error information

---

## Legacy Documentation (v1.x)

_The following sections document the previous complex implementation for reference:_

### Legacy Request Object Format

Previously required complex request objects:

```json
"RequestObject":{
    "Small": {
      "type":"Personality",
      "descriptions":"Insight into your Interests",
      "reward":"10% Discount"
    },
    "Medium":{
      "type":"Personality",
      "descriptions":"Insight into your Interests",
      "reward":"2 USDC"
    },
    "Large":{
      "type":"Personality",
      "descriptions":"Insight into your Interests",
      "reward":"2 USDC"
    }
  }
```

### Legacy API Usage

Previously required manual event handling:

```jsx
export default async function UseAPIURL(event) {
  if (
    event.data &&
    event.data.source === "content-script" &&
    event.data.type === "API_URL_RESPONSE"
  ) {
    const { APIurl, accessToken } = event.data;
    await fetch(APIurl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(InputData),
    })
      .then(async (data) => {
        // process Onairos Data
      })
      .catch((error) => console.error(error));
  }
}
```

_This manual approach is no longer needed with v2.0's autoFetch functionality._

### Legacy Output Format

API still responds with the same format:

```json
{
  "output": [[[0.9998]], [[0.9999]], [[0.9922]], [[0.0013]]]
}
```

### Integration Notes

When integrating the onairos package into your application, ensure your Webpack configuration handles dynamic imports correctly and serves the necessary chunk files from `node_modules/onairos/dist`.
