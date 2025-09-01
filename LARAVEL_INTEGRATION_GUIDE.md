# Onairos Laravel Integration Guide

A comprehensive guide for integrating Onairos with Laravel Vite applications, supporting Blade templates, Vue.js, React, and mixed approaches.

## 🚀 Quick Start

### Prerequisites
- Laravel 9+ with Vite
- Node.js 16+
- npm or yarn

### Installation

```bash
npm install onairos
```

## 📋 Integration Options

### Option 1: Blade Templates (PHP Only)

Perfect for traditional Laravel applications using Blade templates with minimal JavaScript.

#### 1. Add to your `vite.config.js`:

```js
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
            bladeSupport: true,
            injectGlobals: true
        })
    ],
});
```

#### 2. Include in your Blade layout:

```blade
{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <title>{{ config('app.name') }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    @yield('content')
</body>
</html>
```

#### 3. Initialize in your `resources/js/app.js`:

```js
import './bootstrap';
import { initializeOnairosForBlade } from 'onairos/blade';

// Initialize Onairos for Blade templates
document.addEventListener('DOMContentLoaded', () => {
    initializeOnairosForBlade({
        testMode: import.meta.env.DEV,
        autoDetectMobile: true,
        globalStyles: true
    });
});
```

#### 4. Use in Blade templates:

```blade
{{-- resources/views/dashboard.blade.php --}}
@extends('layouts.app')

@section('content')
<div class="container">
    <h1>Welcome to Dashboard</h1>
    
    <!-- Simple button -->
    <div id="onairos-button-1"></div>
    
    <!-- Custom configuration -->
    <div id="onairos-button-2"></div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Simple button
    createOnairosButton('onairos-button-1', {
        requestData: ['email', 'profile'],
        webpageName: 'My Dashboard'
    });
    
    // Advanced button
    createOnairosButton('onairos-button-2', {
        requestData: {
            basic: { type: "basic", reward: "10 tokens" },
            personality: { type: "personality", reward: "25 tokens" }
        },
        webpageName: 'Advanced Dashboard',
        buttonType: 'icon',
        onComplete: function(result) {
            alert('Connection successful!');
        }
    });
});
</script>
@endsection
```

---

### Option 2: Vue.js Integration

Perfect for Laravel applications using Vue.js as the frontend framework.

#### 1. Install Vue plugin:

```bash
npm install --save-dev @vitejs/plugin-vue
```

#### 2. Update `vite.config.js`:

```js
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
        vue({
            template: {
                transformAssetUrls: {
                    base: null,
                    includeAbsolute: false,
                },
            },
        }),
        onairosVuePlugin({
            autoImport: true
        })
    ],
});
```

#### 3. Set up Vue in `resources/js/app.js`:

```js
import './bootstrap';
import { createApp } from 'vue';
import OnairosVue from 'onairos/src/laravel/OnairosVue.vue';

const app = createApp({});

// Register Onairos component globally
app.component('onairos-button', OnairosVue);

app.mount('#app');
```

#### 4. Use in Blade templates:

```blade
{{-- resources/views/vue-dashboard.blade.php --}}
@extends('layouts.app')

@section('content')
<div id="app">
    <div class="container">
        <h1>Vue.js Dashboard</h1>
        
        <!-- Basic usage -->
        <onairos-button 
            :request-data="['email', 'profile']"
            webpage-name="Vue Dashboard"
            @complete="handleComplete"
        ></onairos-button>
        
        <!-- Advanced usage -->
        <onairos-button 
            :request-data="{
                basic: { type: 'basic', reward: '10 tokens' },
                personality: { type: 'personality', reward: '25 tokens' }
            }"
            webpage-name="Advanced Vue Dashboard"
            button-type="pill"
            size="large"
            @complete="handleAdvancedComplete"
            @error="handleError"
        >
            Connect Advanced Features
        </onairos-button>
    </div>
</div>

<script>
function handleComplete(result) {
    console.log('Onairos connection completed:', result);
}

function handleAdvancedComplete(result) {
    console.log('Advanced connection completed:', result);
}

function handleError(error) {
    console.error('Connection failed:', error);
}
</script>
@endsection
```

#### 5. Use in Vue SFC files:

```vue
{{-- resources/js/components/UserProfile.vue --}}
<template>
  <div class="user-profile">
    <h2>User Profile</h2>
    <onairos-button
      :request-data="['email', 'profile', 'preferences']"
      :webpage-name="profileName"
      :test-mode="isDevelopment"
      size="medium"
      @complete="onConnectionComplete"
      @loading="onLoading"
    >
      Enhance Profile with AI
    </onairos-button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import OnairosVue from 'onairos/src/laravel/OnairosVue.vue';

const profileName = ref('User Profile Enhancement');
const isDevelopment = computed(() => import.meta.env.DEV);

function onConnectionComplete(result) {
  console.log('Profile enhancement completed:', result);
}

function onLoading(isLoading) {
  console.log('Loading state:', isLoading);
}
</script>
```

---

### Option 3: React Integration

For Laravel applications using React as the frontend framework.

#### 1. Install React plugin:

```bash
npm install --save-dev @vitejs/plugin-react
```

#### 2. Update `vite.config.js`:

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { onairosReactPlugin } from 'onairos/vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        onairosReactPlugin({
            autoImport: true
        })
    ],
});
```

#### 3. Set up React in `resources/js/app.jsx`:

```jsx
import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { OnairosButton } from 'onairos';

function App() {
    const handleComplete = (result) => {
        console.log('Onairos connection completed:', result);
    };

    const handleError = (error) => {
        console.error('Connection failed:', error);
    };

    return (
        <div className="container">
            <h1>React Dashboard</h1>
            
            <OnairosButton
                requestData={['email', 'profile']}
                webpageName="React Dashboard"
                onComplete={handleComplete}
                onError={handleError}
                buttonType="pill"
                textColor="black"
            />
        </div>
    );
}

const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
```

---

## 🛠️ Advanced Configuration

### Custom Vite Plugin Options

```js
// vite.config.js
onairosLaravelPlugin({
    // Auto-import Onairos components
    autoImport: true,
    
    // Inject global helpers for Blade templates
    injectGlobals: true,
    
    // Optimize dependencies for faster dev server
    optimizeDeps: true,
    
    // Enable Hot Module Replacement
    enableHMR: true,
    
    // Watch Blade files for changes
    bladeSupport: true
})
```

### Environment Configuration

```env
# .env
VITE_ONAIROS_API_KEY=your_api_key_here
VITE_ONAIROS_TEST_MODE=true
VITE_ONAIROS_BASE_URL=https://api2.onairos.uk
```

```js
// resources/js/app.js
initializeOnairosForBlade({
    apiKey: import.meta.env.VITE_ONAIROS_API_KEY,
    testMode: import.meta.env.VITE_ONAIROS_TEST_MODE === 'true',
    baseUrl: import.meta.env.VITE_ONAIROS_BASE_URL
});
```

### Laravel Backend Integration

Create a controller to handle Onairos callbacks:

```php
<?php
// app/Http/Controllers/OnairosController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OnairosController extends Controller
{
    public function callback(Request $request)
    {
        $data = $request->validate([
            'user_hash' => 'required|string',
            'connections' => 'required|array',
            'data_types' => 'required|array'
        ]);

        // Store user connections
        $user = auth()->user();
        if ($user) {
            $user->update([
                'onairos_hash' => $data['user_hash'],
                'onairos_connections' => $data['connections'],
                'onairos_data_types' => $data['data_types']
            ]);
        }

        Log::info('Onairos callback received', $data);

        return response()->json(['success' => true]);
    }
}
```

Add routes:

```php
// routes/web.php
use App\Http\Controllers\OnairosController;

Route::post('/onairos/callback', [OnairosController::class, 'callback'])
    ->middleware('auth');
```

---

## 🎨 Styling

### Tailwind CSS Integration

```js
// tailwind.config.js
module.exports = {
    content: [
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.vue',
        './node_modules/onairos/**/*.{js,vue}'
    ],
    theme: {
        extend: {
            colors: {
                'onairos': {
                    50: '#f0f4ff',
                    500: '#667eea',
                    600: '#5a67d8',
                    700: '#4c51bf'
                }
            }
        }
    }
}
```

### Custom CSS

```css
/* resources/css/onairos-custom.css */
.onairos-vue-btn {
    @apply bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700;
}

.onairos-btn-pill {
    @apply rounded-full;
}

.onairos-btn-large {
    @apply px-8 py-4 text-lg;
}
```

---

## 📱 Mobile Optimization

Onairos automatically detects mobile devices and switches OAuth flows:

- **Desktop**: Popup windows
- **Mobile**: Redirect-based flow

### Mobile-Specific Configuration

```js
// Auto-detect and configure for mobile
initializeOnairosForBlade({
    autoDetectMobile: true,
    mobileRedirectUrl: window.location.href,
    popupDimensions: {
        width: 450,
        height: 700
    }
});
```

---

## 🚨 Troubleshooting

### Common Issues

1. **Vite Plugin Not Working**
   ```bash
   # Clear Vite cache
   rm -rf node_modules/.vite
   npm run dev
   ```

2. **Vue Component Not Rendering**
   ```js
   // Make sure Vue is properly configured
   import { createApp } from 'vue';
   const app = createApp({});
   app.mount('#app');
   ```

3. **Blade Helpers Not Available**
   ```js
   // Check initialization
   console.log(typeof window.createOnairosButton);
   // Should log: "function"
   ```

### Debug Mode

Enable debug logging:

```js
initializeOnairosForBlade({
    debug: true,
    testMode: true
});
```

---

## 📚 API Reference

### Blade Helpers

```js
// Initialize Onairos for Blade templates
initializeOnairosForBlade(config)

// Create button in specific element
createOnairosButton(elementId, options)

// Render directive (for PHP integration)
renderOnairosDirective(options)
```

### Vue Component Props

```typescript
interface OnairosVueProps {
  requestData: Array | Object;
  webpageName: string;
  testMode?: boolean;
  autoFetch?: boolean;
  buttonType?: 'pill' | 'icon' | 'rounded';
  textColor?: string;
  textLayout?: 'left' | 'center' | 'right';
  disabled?: boolean;
  customClass?: string;
  loadingText?: string;
  successMessage?: string;
  size?: 'small' | 'medium' | 'large';
}
```

### Events

```js
// Blade templates
window.addEventListener('onairosAuthComplete', (event) => {
    console.log('Auth completed:', event.detail);
});

// Vue components
@complete="handleComplete"
@error="handleError"
@loading="handleLoading"
@click="handleClick"
```

---

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
```

### Laravel Deployment

1. Set environment variables:
   ```env
   VITE_ONAIROS_TEST_MODE=false
   VITE_ONAIROS_API_KEY=your_production_key
   ```

2. Optimize assets:
   ```bash
   php artisan optimize
   php artisan view:cache
   ```

3. Configure CDN (optional):
   ```env
   ASSET_URL=https://your-cdn.com
   ```

---

## 📖 Examples

Check the `examples/` directory for complete working examples:

- `examples/blade-basic/` - Simple Blade integration
- `examples/vue-advanced/` - Vue.js with advanced features
- `examples/react-spa/` - React single-page application
- `examples/mixed-approach/` - Combining Blade + Vue

---

## 🤝 Support

- **Documentation**: [Onairos Docs](https://onairos.uk/docs)
- **GitHub Issues**: [Report Issues](https://github.com/zd819/onairos-npm/issues)
- **Discord**: [Join Community](https://discord.gg/onairos)

---

## 📝 License

MIT License - see LICENSE file for details. 