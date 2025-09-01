## Onairos Developer Documentation v2.0.0

### 🚀 What's New in v2.0.0

- **Popup-based Data Requests**: No more cutoff issues with improved popup window implementation
- **AutoFetch by Default**: Automatic API calls after user approval - no manual handling required
- **Simplified Integration**: Much cleaner and easier to use
- **Enhanced UX**: Better positioning, loading states, and error handling
- **Laravel Vite Support**: First-class integration with Laravel Vite applications

### 1. Create a Developer Account

Create a Developer account to access Onairos services. Register your domain to ensure secure API access.

https://Onairos.uk/dev-board

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
import { OnairosButton } from 'onairos';

function MyApp() {
  return (
    <OnairosButton
      requestData={['email', 'profile', 'social']}
      webpageName="My Application"
      autoFetch={true} // Default - automatically makes API calls
      onComplete={(result) => {
        console.log('Data approved:', result.approved);
        console.log('API Response:', result.apiResponse); // Available when autoFetch is true
        
        if (result.apiResponse) {
          // Use the API response data directly
          console.log('User data:', result.apiResponse);
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
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { onairosLaravelPlugin } from 'onairos/vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        onairosLaravelPlugin({
            bladeSupport: true
        })
    ],
});
```

```js
// resources/js/app.js
import { initializeOnairosForBlade } from 'onairos/blade';

document.addEventListener('DOMContentLoaded', () => {
    initializeOnairosForBlade({
        testMode: import.meta.env.DEV,
        autoDetectMobile: true
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
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import { onairosVuePlugin } from 'onairos/vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        vue(),
        onairosVuePlugin()
    ],
});
```

```js
// resources/js/app.js
import { createApp } from 'vue';
import OnairosVue from 'onairos/src/laravel/OnairosVue.vue';

const app = createApp({});
app.component('onairos-button', OnairosVue);
app.mount('#app');
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
    if (event.data?.source === 'content-script' && event.data?.type === 'API_URL_RESPONSE') {
      const { APIurl, accessToken } = event.data;
      // Manual API call handling
      fetch(APIurl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify(InputData),
      });
    }
  };
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);

<Onairos requestData={complexRequestObject} webpageName={webpageName} />
```

**After (v2.0 - Simple)**:
```jsx
// New simplified approach
<OnairosButton
  requestData={['email', 'profile']}
  webpageName="My App"
  onComplete={(result) => {
    // API call already made automatically
    console.log('User data:', result.apiResponse);
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
  requestData={['email']}
  webpageName="My App"
  onComplete={(result) => {
    if (result.apiError) {
      console.error('API Error:', result.apiError);
      // Handle error appropriately
    } else if (result.apiResponse) {
      console.log('Success:', result.apiResponse);
      // Process data
    }
  }}
/>
```

### 9. Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### 10. Troubleshooting

**Popup Blocked**: Ensure popups are allowed for your domain in browser settings.

**API Calls Failing**: Verify your domain is registered in the developer console.

**Data Not Loading**: Check browser console for errors and ensure proper integration.

### 11. Support

For issues or questions:
- Check the [troubleshooting guide](./POPUP_IMPLEMENTATION_README.md)
- Review browser console for errors
- Contact support with detailed error information

---

## Legacy Documentation (v1.x)

*The following sections document the previous complex implementation for reference:*

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
export default async function UseAPIURL(event){
    if (event.data && event.data.source === 'content-script' && event.data.type === 'API_URL_RESPONSE') {
      const { APIurl, accessToken } = event.data;
      await fetch(APIurl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(InputData),
      }).then(async (data)=>{
            // process Onairos Data
      })
      .catch(error => console.error(error));
    }
}
```

*This manual approach is no longer needed with v2.0's autoFetch functionality.*

### Legacy Output Format

API still responds with the same format:
```json
{
  "output": [
    [[0.9998]],
    [[0.9999]],
    [[0.9922]],
    [[0.0013]]
  ]
}
```

### Integration Notes

When integrating the onairos package into your application, ensure your Webpack configuration handles dynamic imports correctly and serves the necessary chunk files from `node_modules/onairos/dist`.

