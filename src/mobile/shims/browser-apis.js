/**
 * Browser APIs Shim for React Native
 * 
 * This file provides mock implementations of browser APIs that are not available in React Native.
 * These shims allow the code to run in React Native without errors.
 */

// Mock window.postMessage for React Native
if (typeof window !== 'undefined' && !window.postMessage) {
  window.postMessage = function(message, targetOrigin, transfer) {
    console.log('Shim: window.postMessage called with:', message);
    // In a real implementation, you might want to use React Native's event system
  };
}

// Mock localStorage for React Native
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    _data: {},
    setItem: function(id, val) {
      this._data[id] = String(val);
      return val;
    },
    getItem: function(id) {
      return this._data.hasOwnProperty(id) ? this._data[id] : null;
    },
    removeItem: function(id) {
      return delete this._data[id];
    },
    clear: function() {
      this._data = {};
    }
  };
}

// Mock sessionStorage for React Native
if (typeof sessionStorage === 'undefined') {
  global.sessionStorage = {
    _data: {},
    setItem: function(id, val) {
      this._data[id] = String(val);
      return val;
    },
    getItem: function(id) {
      return this._data.hasOwnProperty(id) ? this._data[id] : null;
    },
    removeItem: function(id) {
      return delete this._data[id];
    },
    clear: function() {
      this._data = {};
    }
  };
}

// Mock document object for React Native if it doesn't exist
if (typeof document === 'undefined') {
  global.document = {
    createElement: () => ({
      style: {},
      setAttribute: () => {},
      appendChild: () => {},
    }),
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
    head: {
      appendChild: () => {},
    },
    createTextNode: () => ({}),
  };
}

// Export API shims
export default {
  // Add any specific exports here if needed
};
