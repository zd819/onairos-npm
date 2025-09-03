/**
 * Laravel Blade Integration Example Test
 * 
 * This test simulates a real Laravel application using Blade templates
 * with Onairos integration.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { initializeOnairosForBlade, createOnairosButton } from '../../../src/laravel/blade-helpers.js';

describe('Laravel Blade Real-World Example', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    // Create a DOM that mimics a Laravel Blade template
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Laravel App with Onairos</title>
        <meta name="csrf-token" content="fake-csrf-token">
      </head>
      <body>
        <div class="container">
          <nav class="navbar">
            <h1>My Laravel App</h1>
          </nav>
          
          <main class="content">
            <div class="dashboard">
              <h2>User Dashboard</h2>
              <p>Connect your social accounts to enhance your experience:</p>
              
              <!-- Onairos button will be inserted here -->
              <div id="social-connect-button" class="mt-4"></div>
              
              <div class="user-profile mt-6">
                <h3>Profile Enhancement</h3>
                <p>Let AI analyze your data for better recommendations:</p>
                
                <!-- Another Onairos button for advanced features -->
                <div id="profile-enhancement-button" class="mt-2"></div>
              </div>
            </div>
          </main>
        </div>
      </body>
      </html>
    `);

    window = dom.window;
    document = dom.window.document;
    
    // Set globals for testing
    global.window = window;
    global.document = document;
    global.navigator = window.navigator;
  });

  test('should integrate Onairos into Laravel dashboard page', () => {
    // 1. Initialize Onairos as would be done in Laravel app.js
    initializeOnairosForBlade({
      testMode: true,
      baseUrl: 'https://api2.onairos.uk',
      autoDetectMobile: true,
      globalStyles: true
    });

    // 2. Verify initialization worked
    expect(window.OnairosConfig).toBeDefined();
    expect(window.OnairosConfig.testMode).toBe(true);
    expect(document.getElementById('onairos-styles')).not.toBeNull();

    // 3. Create social connect button (as would be in Blade template script)
    createOnairosButton('social-connect-button', {
      requestData: ['email', 'profile', 'social'],
      webpageName: 'Laravel Dashboard',
      buttonType: 'pill',
      textColor: 'white',
      onComplete: function(result) {
        console.log('Social connection completed:', result);
        // In real Laravel app, this might update the UI or make AJAX calls
      }
    });

    // 4. Create profile enhancement button
    createOnairosButton('profile-enhancement-button', {
      requestData: {
        basic: { type: "basic", reward: "10 tokens" },
        personality: { type: "personality", reward: "25 tokens" },
        preferences: { type: "preferences", reward: "15 tokens" }
      },
      webpageName: 'Laravel Profile Enhancement',
      buttonType: 'rounded',
      textColor: 'black',
      onComplete: function(result) {
        console.log('Profile enhancement completed:', result);
      }
    });

    // 5. Verify both buttons were created successfully
    const socialButton = document.getElementById('social-connect-button-btn');
    const profileButton = document.getElementById('profile-enhancement-button-btn');
    
    expect(socialButton).not.toBeNull();
    expect(profileButton).not.toBeNull();
    
    // 6. Verify button configurations
    const socialConfig = JSON.parse(socialButton.getAttribute('data-onairos-config'));
    const profileConfig = JSON.parse(profileButton.getAttribute('data-onairos-config'));
    
    expect(socialConfig.requestData).toEqual(['email', 'profile', 'social']);
    expect(socialConfig.webpageName).toBe('Laravel Dashboard');
    expect(socialConfig.buttonType).toBe('pill');
    
    expect(profileConfig.requestData).toHaveProperty('basic');
    expect(profileConfig.requestData).toHaveProperty('personality');
    expect(profileConfig.webpageName).toBe('Laravel Profile Enhancement');
    expect(profileConfig.buttonType).toBe('rounded');

    // 7. Verify styling was applied
    expect(socialButton.className).toContain('onairos-btn-pill');
    expect(profileButton.className).toContain('onairos-btn-rounded');
  });

  test('should handle Laravel CSRF protection', () => {
    // Laravel apps typically have CSRF tokens in meta tags
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    expect(csrfToken).toBe('fake-csrf-token');

    // Initialize Onairos with CSRF handling
    initializeOnairosForBlade({
      csrfToken: csrfToken,
      testMode: true
    });

    expect(window.OnairosConfig.csrfToken).toBe('fake-csrf-token');
  });

  test('should support Laravel environment variables pattern', () => {
    // Mock Laravel Vite environment variables
    global.import = {
      meta: {
        env: {
          DEV: false,
          PROD: true,
          VITE_APP_NAME: 'Laravel App',
          VITE_ONAIROS_API_KEY: 'prod-api-key',
          VITE_ONAIROS_TEST_MODE: 'false'
        }
      }
    };

    // Initialize using Laravel environment pattern
    initializeOnairosForBlade({
      testMode: global.import.meta.env.VITE_ONAIROS_TEST_MODE === 'true',
      apiKey: global.import.meta.env.VITE_ONAIROS_API_KEY,
      appName: global.import.meta.env.VITE_APP_NAME
    });

    expect(window.OnairosConfig.testMode).toBe(false);
    expect(window.OnairosConfig.apiKey).toBe('prod-api-key');
    expect(window.OnairosConfig.appName).toBe('Laravel App');
  });

  test('should handle mobile responsive behavior in Laravel context', () => {
    // Mock mobile user agent (iPhone)
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });

    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375
    });

    initializeOnairosForBlade({
      autoDetectMobile: true
    });

    expect(window.OnairosUtils.isMobile).toBe(true);

    // Create a button and verify mobile-specific behavior
    createOnairosButton('mobile-test-button', {
      requestData: ['email'],
      webpageName: 'Mobile Laravel App'
    });

    const button = document.getElementById('mobile-test-button-btn');
    expect(button).not.toBeNull();

    // In mobile context, button should have mobile-optimized styling
    const styles = window.getComputedStyle ? window.getComputedStyle(button) : {};
    // Note: JSDOM doesn't compute styles, but we can verify the classes are applied
    expect(button.className).toContain('onairos-btn');
  });

  test('should simulate Laravel Ajax integration', async () => {
    // Mock Laravel AJAX setup (similar to what Laravel includes by default)
    window.axios = {
      defaults: {
        headers: {
          common: {
            'X-CSRF-TOKEN': 'fake-csrf-token',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      },
      post: vi.fn(() => Promise.resolve({ data: { success: true } }))
    };

    initializeOnairosForBlade({
      testMode: true,
      onAuthComplete: async function(result) {
        // Simulate Laravel AJAX call to store Onairos data
        try {
          const response = await window.axios.post('/onairos/callback', {
            user_hash: result.userHash,
            connections: result.connectedAccounts,
            data_types: result.requestData
          });
          
          if (response.data.success) {
            console.log('Laravel backend updated successfully');
          }
        } catch (error) {
          console.error('Laravel integration error:', error);
        }
      }
    });

    // Trigger a simulated auth completion
    const mockResult = {
      userHash: 'test-hash-123',
      connectedAccounts: ['youtube', 'linkedin'],
      requestData: ['email', 'profile']
    };

    // Simulate the callback
    if (window.OnairosConfig.onAuthComplete) {
      await window.OnairosConfig.onAuthComplete(mockResult);
    }

    // Verify Laravel AJAX was called
    expect(window.axios.post).toHaveBeenCalledWith('/onairos/callback', {
      user_hash: 'test-hash-123',
      connections: ['youtube', 'linkedin'],
      data_types: ['email', 'profile']
    });
  });

  test('should work with Laravel Blade @vite directive pattern', () => {
    // Simulate what happens when Laravel's @vite directive loads assets
    const viteScript = document.createElement('script');
    viteScript.type = 'module';
    viteScript.textContent = `
      // Simulate Vite module loading
      import { initializeOnairosForBlade } from '/resources/js/onairos-setup.js';
      
      // Auto-initialize when loaded via Vite
      document.addEventListener('DOMContentLoaded', () => {
        initializeOnairosForBlade({
          testMode: import.meta.env.DEV,
          baseUrl: import.meta.env.VITE_ONAIROS_BASE_URL
        });
      });
    `;
    
    document.head.appendChild(viteScript);
    
    // Verify script was added (simulating Vite asset injection)
    const addedScript = document.querySelector('script[type="module"]');
    expect(addedScript).not.toBeNull();
    expect(addedScript.textContent).toContain('initializeOnairosForBlade');
  });
}); 