// src/index.js

import { Onairos } from "./onairos.jsx";
import { OnairosClient } from "./sdk/OnairosClient.js";

// Export the original Onairos component
export { Onairos };

// Export the new Onairos SDK
export { OnairosClient };

// Export SDK components for advanced usage
export { LLMWrapper } from "./sdk/LLMWrapper.js";
export { MemoryManager } from "./sdk/MemoryManager.js";
export { SessionManager } from "./sdk/SessionManager.js";

// Export utility functions
export { extractMemory, hasMeaningfulMemory, cleanMemoryData } from "./utils/extractMemory.js";

// You can also export additional functions or constants if needed
