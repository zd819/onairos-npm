// src/index.js

// Import Tailwind CSS first
import './styles/tailwind.css';

import { Onairos } from "./onairos.jsx";
import { OnairosReconnectButton } from "./OnairosReconnectButton.jsx";

// Export the original Onairos component
export { Onairos };

// Export the new Onairos SDK
export { OnairosClient };

// Export the Reconnect Button for managing data sources
export { OnairosReconnectButton };

// Export Capacitor/Mobile detection utilities
export {
  isCapacitor,
  isReactNative,
  isMobileApp,
  isIOS,
  isAndroid,
  getPlatformInfo,
  isMobileBrowser,
  getEnvironmentType,
  supportsBrowserExtensions,
  logPlatformInfo
} from './utils/capacitorDetection.js';

// Export Capacitor LLM data collection functions (native method - no extension needed)
export {
  storeCapacitorLLMData,
  storeBatchLLMData,
  getLLMHistory,
  getLLMStats,
  formatConversationData
} from './utils/capacitorLLMHelper.js';

// Export browser extension utilities (for web browsers only)
export {
  storeLLMConversationData,
  detectOnairosExtension,
  sendUserInfoToExtension,
  getUserInfoFromStorage
} from './utils/extensionDetection.js';

// Export platform disconnect and destruct utilities
export {
  disconnectPlatform,
  disconnectMultiplePlatforms,
  destructWrappedData,
  updateLocalStorageAfterDisconnect,
  updateLocalStorageAfterDestruct,
  hasAuthToken,
  getSupportedPlatforms,
  isPlatformSupported
} from './utils/platformDisconnect.js';
