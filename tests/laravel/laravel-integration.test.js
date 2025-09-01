/**
 * Laravel Integration Test Suite
 * 
 * Tests the Laravel-specific functionality of the Onairos package
 * including Blade helpers, Vue components, and Vite plugins.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { createApp } from 'vue';
import { mount } from '@vue/test-utils';

// Import Laravel-specific modules
import { 
  initializeOnairosForBlade, 
  createOnairosButton,
  renderOnairosDirective
} from '../../src/laravel/blade-helpers.js';

import OnairosVue from '../../src/laravel/OnairosVue.vue';

import { 
  onairosLaravelPlugin,
  onairosVuePlugin,
  onairosReactPlugin
} from '../../src/laravel/vite-plugin.js';

// Mock DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

describe('Laravel Blade Integration', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Reset global objects
    delete window.OnairosConfig;
    delete window.OnairosUtils;
    delete window.createOnairosButton;
    delete window.initializeOnairosForBlade;
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeOnairosForBlade', () => {
    test('should initialize with default configuration', () => {
      initializeOnairosForBlade();
      
      expect(window.OnairosConfig).toBeDefined();
      expect(window.OnairosConfig.baseUrl).toBe('https://api2.onairos.uk');
      expect(window.OnairosConfig.testMode).toBe(false);
      expect(window.OnairosConfig.autoDetectMobile).toBe(true);
    });

    test('should merge custom configuration', () => {
      const customConfig = {
        apiKey: 'test-api-key',
        testMode: true,
        baseUrl: 'https://custom.api.com'
      };

      initializeOnairosForBlade(customConfig);
      
      expect(window.OnairosConfig.apiKey).toBe('test-api-key');
      expect(window.OnairosConfig.testMode).toBe(true);
      expect(window.OnairosConfig.baseUrl).toBe('https://custom.api.com');
      expect(window.OnairosConfig.autoDetectMobile).toBe(true); // Default preserved
    });

    test('should inject global styles when enabled', () => {
      initializeOnairosForBlade({ globalStyles: true });
      
      const styleElement = document.getElementById('onairos-styles');
      expect(styleElement).not.toBeNull();
      expect(styleElement.textContent).toContain('.onairos-btn');
    });

    test('should not inject styles when disabled', () => {
      initializeOnairosForBlade({ globalStyles: false });
      
      const styleElement = document.getElementById('onairos-styles');
      expect(styleElement).toBeNull();
    });

    test('should setup mobile detection utilities', () => {
      initializeOnairosForBlade();
      
      expect(window.OnairosUtils).toBeDefined();
      expect(typeof window.OnairosUtils.detectMobile).toBe('function');
      expect(typeof window.OnairosUtils.isMobile).toBe('boolean');
    });
  });

  describe('createOnairosButton', () => {
    beforeEach(() => {
      initializeOnairosForBlade();
    });

    test('should create button in target element', () => {
      // Create target element
      const targetDiv = document.createElement('div');
      targetDiv.id = 'test-button';
      document.body.appendChild(targetDiv);

      createOnairosButton('test-button', {
        requestData: ['email', 'profile'],
        webpageName: 'Test App'
      });

      expect(targetDiv.innerHTML).toContain('onairos-button-container');
      expect(targetDiv.innerHTML).toContain('Connect with Onairos');
    });

    test('should handle missing target element gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      
      createOnairosButton('non-existent-element', {});
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Element with ID "non-existent-element" not found')
      );
    });

    test('should apply custom configuration', () => {
      const targetDiv = document.createElement('div');
      targetDiv.id = 'custom-button';
      document.body.appendChild(targetDiv);

      createOnairosButton('custom-button', {
        requestData: ['email'],
        webpageName: 'Custom App',
        buttonType: 'icon',
        textColor: 'blue'
      });

      const button = document.getElementById('custom-button-btn');
      expect(button).not.toBeNull();
      expect(button.className).toContain('onairos-btn-icon');
      
      const textSpan = button.querySelector('.onairos-btn-text');
      expect(textSpan.style.color).toBe('blue');
    });

    test('should add click event listener', () => {
      const targetDiv = document.createElement('div');
      targetDiv.id = 'clickable-button';
      document.body.appendChild(targetDiv);

      createOnairosButton('clickable-button', {
        requestData: ['email'],
        webpageName: 'Clickable App'
      });

      const button = document.getElementById('clickable-button-btn');
      expect(button).not.toBeNull();
      
      // Verify button has click event (we can't easily test the actual click without complex mocking)
      expect(button.onclick).not.toBeNull();
    });
  });

  describe('renderOnairosDirective', () => {
    test('should generate HTML with unique ID', () => {
      const html1 = renderOnairosDirective({ requestData: ['email'] });
      const html2 = renderOnairosDirective({ requestData: ['profile'] });
      
      expect(html1).toContain('<div id="onairos-');
      expect(html2).toContain('<div id="onairos-');
      
      // Extract IDs to ensure they're unique
      const id1 = html1.match(/id="(onairos-[^"]+)"/)[1];
      const id2 = html2.match(/id="(onairos-[^"]+)"/)[1];
      
      expect(id1).not.toBe(id2);
    });

    test('should include configuration in script', () => {
      const options = { 
        requestData: ['email', 'profile'], 
        webpageName: 'Directive Test' 
      };
      
      const html = renderOnairosDirective(options);
      
      expect(html).toContain('createOnairosButton');
      expect(html).toContain(JSON.stringify(options));
      expect(html).toContain('DOMContentLoaded');
    });
  });

  describe('Mobile Detection', () => {
    beforeEach(() => {
      initializeOnairosForBlade();
    });

    test('should detect mobile user agents', () => {
      // Mock mobile user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      });

      const isMobile = window.OnairosUtils.detectMobile();
      expect(isMobile).toBe(true);
    });

    test('should detect desktop user agents', () => {
      // Mock desktop user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      // Mock window dimensions for desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1920
      });

      const isMobile = window.OnairosUtils.detectMobile();
      expect(isMobile).toBe(false);
    });

    test('should detect mobile by screen width', () => {
      // Mock narrow screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 500
      });

      const isMobile = window.OnairosUtils.detectMobile();
      expect(isMobile).toBe(true);
    });
  });
});

describe('Laravel Vue Integration', () => {
  describe('OnairosVue Component', () => {
    test('should render with default props', () => {
      const wrapper = mount(OnairosVue);
      
      expect(wrapper.find('.onairos-vue-wrapper').exists()).toBe(true);
      expect(wrapper.find('.onairos-vue-btn').exists()).toBe(true);
      expect(wrapper.text()).toContain('Connect with Onairos');
    });

    test('should accept custom props', () => {
      const wrapper = mount(OnairosVue, {
        props: {
          requestData: ['email', 'profile', 'preferences'],
          webpageName: 'Vue Test App',
          buttonType: 'rounded',
          size: 'large',
          textColor: 'black'
        }
      });

      expect(wrapper.vm.requestData).toEqual(['email', 'profile', 'preferences']);
      expect(wrapper.vm.webpageName).toBe('Vue Test App');
      expect(wrapper.vm.buttonType).toBe('rounded');
      expect(wrapper.vm.size).toBe('large');
    });

    test('should validate prop types', () => {
      // Test invalid buttonType
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      mount(OnairosVue, {
        props: {
          buttonType: 'invalid-type'
        }
      });

      // Vue should warn about invalid prop value
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('should apply correct CSS classes', () => {
      const wrapper = mount(OnairosVue, {
        props: {
          buttonType: 'pill',
          size: 'large',
          customClass: 'my-custom-class'
        }
      });

      const button = wrapper.find('.onairos-vue-btn');
      expect(button.classes()).toContain('onairos-btn-pill');
      expect(button.classes()).toContain('onairos-btn-large');
      expect(button.classes()).toContain('my-custom-class');
    });

    test('should handle loading state', async () => {
      const wrapper = mount(OnairosVue);
      
      // Initially not loading
      expect(wrapper.find('.onairos-loading').exists()).toBe(false);
      expect(wrapper.find('.onairos-vue-btn').exists()).toBe(true);

      // Set loading state
      await wrapper.setData({ isLoading: true });
      
      expect(wrapper.find('.onairos-loading').exists()).toBe(true);
      expect(wrapper.find('.onairos-vue-btn').exists()).toBe(false);
    });

    test('should emit events on click', async () => {
      const wrapper = mount(OnairosVue);
      
      await wrapper.find('.onairos-vue-btn').trigger('click');
      
      expect(wrapper.emitted()).toHaveProperty('click');
      expect(wrapper.emitted()).toHaveProperty('loading');
    });

    test('should show success message', async () => {
      const wrapper = mount(OnairosVue, {
        props: {
          successMessage: 'Custom success message'
        }
      });

      await wrapper.setData({ showSuccess: true });
      
      const successDiv = wrapper.find('.onairos-success');
      expect(successDiv.exists()).toBe(true);
      expect(successDiv.text()).toContain('Custom success message');
    });

    test('should show error message', async () => {
      const wrapper = mount(OnairosVue);

      await wrapper.setData({ error: 'Connection failed' });
      
      const errorDiv = wrapper.find('.onairos-error');
      expect(errorDiv.exists()).toBe(true);
      expect(errorDiv.text()).toContain('Connection failed');
    });

    test('should disable button when disabled prop is true', () => {
      const wrapper = mount(OnairosVue, {
        props: {
          disabled: true
        }
      });

      const button = wrapper.find('.onairos-vue-btn');
      expect(button.attributes('disabled')).toBeDefined();
      expect(button.classes()).toContain('onairos-btn-disabled');
    });
  });
});

describe('Laravel Vite Plugin Integration', () => {
  describe('onairosLaravelPlugin', () => {
    test('should create plugin with default options', () => {
      const plugin = onairosLaravelPlugin();
      
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('onairos-laravel');
      expect(typeof plugin.config).toBe('function');
    });

    test('should accept custom options', () => {
      const customOptions = {
        autoImport: false,
        bladeSupport: false,
        enableHMR: false
      };
      
      const plugin = onairosLaravelPlugin(customOptions);
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('onairos-laravel');
    });

    test('should configure Vite properly', () => {
      const plugin = onairosLaravelPlugin({
        optimizeDeps: true,
        bladeSupport: true
      });

      const mockViteConfig = {
        optimizeDeps: { include: [] },
        resolve: { alias: {} },
        server: { watch: { include: [] } }
      };

      // Simulate Vite calling the config function
      plugin.config(mockViteConfig, { command: 'serve' });

      expect(mockViteConfig.optimizeDeps.include).toContain('onairos');
      expect(mockViteConfig.resolve.alias['@onairos']).toBeDefined();
      expect(mockViteConfig.server.watch.include).toContain('resources/views/**/*.blade.php');
    });
  });

  describe('onairosVuePlugin', () => {
    test('should create Vue-specific plugin', () => {
      const plugin = onairosVuePlugin();
      
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('onairos-vue-laravel');
      expect(typeof plugin.config).toBe('function');
    });

    test('should configure Vue dependencies', () => {
      const plugin = onairosVuePlugin();
      const mockViteConfig = {
        optimizeDeps: { include: [] }
      };

      plugin.config(mockViteConfig);

      expect(mockViteConfig.optimizeDeps.include).toContain('onairos');
      expect(mockViteConfig.optimizeDeps.include).toContain('vue');
    });

    test('should handle auto-import for Vue files', () => {
      const plugin = onairosVuePlugin({ autoImport: true });
      
      const codeWithOnairosButton = '<template><OnairosButton /></template>';
      const codeWithoutImport = 'export default {}';
      
      // Mock transform function
      const result1 = plugin.transform(codeWithOnairosButton, 'Component.vue');
      const result2 = plugin.transform(codeWithoutImport, 'Other.vue');
      
      expect(result1).toContain("import { OnairosButton } from 'onairos'");
      expect(result2).toBeNull(); // No transform needed
    });
  });

  describe('onairosReactPlugin', () => {
    test('should create React-specific plugin', () => {
      const plugin = onairosReactPlugin();
      
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('onairos-react-laravel');
      expect(typeof plugin.config).toBe('function');
    });

    test('should configure React dependencies', () => {
      const plugin = onairosReactPlugin();
      const mockViteConfig = {
        optimizeDeps: { include: [] }
      };

      plugin.config(mockViteConfig);

      expect(mockViteConfig.optimizeDeps.include).toContain('onairos');
      expect(mockViteConfig.optimizeDeps.include).toContain('react');
      expect(mockViteConfig.optimizeDeps.include).toContain('react-dom');
    });

    test('should handle auto-import for React files', () => {
      const plugin = onairosReactPlugin({ autoImport: true });
      
      const jsxCode = 'function App() { return <OnairosButton />; }';
      const tsxCode = 'const App: React.FC = () => <OnairosButton />;';
      const regularJs = 'console.log("hello");';
      
      const result1 = plugin.transform(jsxCode, 'App.jsx');
      const result2 = plugin.transform(tsxCode, 'App.tsx');
      const result3 = plugin.transform(regularJs, 'utils.js');
      
      expect(result1).toContain("import { OnairosButton } from 'onairos'");
      expect(result2).toContain("import { OnairosButton } from 'onairos'");
      expect(result3).toBeNull();
    });
  });
});

describe('Laravel Integration - End-to-End Scenarios', () => {
  beforeEach(() => {
    // Reset environment
    document.body.innerHTML = '';
    delete window.OnairosConfig;
    delete window.OnairosUtils;
  });

  test('should support complete Blade integration workflow', () => {
    // 1. Initialize Onairos for Blade
    initializeOnairosForBlade({
      testMode: true,
      webpageName: 'E2E Test App'
    });

    // 2. Create button element
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'e2e-button';
    document.body.appendChild(buttonContainer);

    // 3. Create Onairos button
    createOnairosButton('e2e-button', {
      requestData: ['email', 'profile'],
      webpageName: 'E2E Test',
      buttonType: 'pill'
    });

    // 4. Verify complete setup
    expect(window.OnairosConfig).toBeDefined();
    expect(window.OnairosUtils).toBeDefined();
    expect(document.getElementById('e2e-button-btn')).not.toBeNull();
    expect(document.getElementById('onairos-styles')).not.toBeNull();
  });

  test('should handle multiple buttons on same page', () => {
    initializeOnairosForBlade();

    // Create multiple button containers
    const container1 = document.createElement('div');
    container1.id = 'button-1';
    const container2 = document.createElement('div');
    container2.id = 'button-2';
    
    document.body.appendChild(container1);
    document.body.appendChild(container2);

    // Create multiple buttons
    createOnairosButton('button-1', {
      requestData: ['email'],
      webpageName: 'App 1'
    });

    createOnairosButton('button-2', {
      requestData: ['profile'],
      webpageName: 'App 2'
    });

    // Verify both buttons exist
    expect(document.getElementById('button-1-btn')).not.toBeNull();
    expect(document.getElementById('button-2-btn')).not.toBeNull();
    
    // Verify they have different configurations
    const btn1 = document.getElementById('button-1-btn');
    const btn2 = document.getElementById('button-2-btn');
    
    const config1 = JSON.parse(btn1.getAttribute('data-onairos-config'));
    const config2 = JSON.parse(btn2.getAttribute('data-onairos-config'));
    
    expect(config1.webpageName).toBe('App 1');
    expect(config2.webpageName).toBe('App 2');
  });

  test('should handle initialization errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Try to create button without initialization
    createOnairosButton('non-existent', {});

    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe('Laravel Environment Integration', () => {
  test('should work with Laravel .env variables', () => {
    // Mock import.meta.env for Laravel Vite
    global.import = {
      meta: {
        env: {
          DEV: true,
          VITE_ONAIROS_API_KEY: 'test-key',
          VITE_ONAIROS_TEST_MODE: 'true',
          VITE_ONAIROS_BASE_URL: 'https://test.api.com'
        }
      }
    };

    initializeOnairosForBlade({
      testMode: global.import.meta.env.VITE_ONAIROS_TEST_MODE === 'true',
      apiKey: global.import.meta.env.VITE_ONAIROS_API_KEY,
      baseUrl: global.import.meta.env.VITE_ONAIROS_BASE_URL
    });

    expect(window.OnairosConfig.testMode).toBe(true);
    expect(window.OnairosConfig.apiKey).toBe('test-key');
    expect(window.OnairosConfig.baseUrl).toBe('https://test.api.com');
  });
});

describe('Laravel Performance Tests', () => {
  test('should initialize quickly', () => {
    const startTime = performance.now();
    
    initializeOnairosForBlade();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should initialize in less than 50ms
    expect(duration).toBeLessThan(50);
  });

  test('should create buttons efficiently', () => {
    initializeOnairosForBlade();
    
    const container = document.createElement('div');
    container.id = 'perf-test';
    document.body.appendChild(container);
    
    const startTime = performance.now();
    
    createOnairosButton('perf-test', {
      requestData: ['email'],
      webpageName: 'Performance Test'
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should create button in less than 20ms
    expect(duration).toBeLessThan(20);
  });

  test('should handle multiple buttons efficiently', () => {
    initializeOnairosForBlade();
    
    const startTime = performance.now();
    
    // Create 10 buttons
    for (let i = 0; i < 10; i++) {
      const container = document.createElement('div');
      container.id = `perf-button-${i}`;
      document.body.appendChild(container);
      
      createOnairosButton(`perf-button-${i}`, {
        requestData: ['email'],
        webpageName: `Perf Test ${i}`
      });
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should create 10 buttons in less than 100ms
    expect(duration).toBeLessThan(100);
  });
}); 