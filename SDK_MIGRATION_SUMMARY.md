# Onairos LLM SDK - Backend Migration Summary

## Overview
The Onairos LLM SDK has been **migrated from frontend to backend** to improve security, performance, and enable server-side RAG (Retrieval-Augmented Generation) capabilities. This document summarizes the SDK components that were removed from the frontend package.

## Architecture Summary

### Core Components Migrated

#### 1. **OnairosClient** (`OnairosClient.js`)
- **Purpose**: Main SDK entry point providing unified completion API with RAG enhancement
- **Key Features**:
  - Unified interface for multiple LLM providers
  - RAG-enhanced personalization using user memory
  - Session management and validation
  - User memory management (store/retrieve/clear)

#### 2. **LLMWrapper** (`LLMWrapper.js`)
- **Purpose**: Unified interface for multiple LLM providers
- **Supported Providers**:
  - **OpenAI**: GPT-4, GPT-4-turbo, GPT-3.5-turbo, O1-preview, O1-mini
  - **Anthropic**: Claude-3-opus, Claude-3-sonnet, Claude-3-haiku, Claude-3.5-sonnet
  - **Google**: Gemini-pro, Gemini-pro-vision, Gemini-1.5-pro, Gemini-1.5-flash
- **Features**:
  - Standardized response format across providers
  - Message format conversion for each provider
  - Error handling and API key management

#### 3. **MemoryManager** (`MemoryManager.js`)
- **Purpose**: RAG functionality with vector storage and memory extraction
- **Key Features**:
  - **Pinecone Integration**: Vector database for semantic search
  - **OpenAI Embeddings**: text-embedding-3-small model
  - **Memory Extraction**: Intelligent extraction of meaningful data from conversations
  - **Semantic Retrieval**: Context-aware memory retrieval for personalization
  - **User Isolation**: Per-user memory management and cleanup

#### 4. **SessionManager** (`SessionManager.js`)
- **Purpose**: User authentication and session isolation
- **Features**:
  - **JWT Token Management**: Secure session tokens with expiration
  - **User Validation**: Session validation and user access control
  - **API Key Generation**: Server-to-server authentication
  - **Guest Sessions**: Anonymous user support

## Dependencies Migrated

The following npm packages were used in the frontend SDK and are now backend dependencies:

```json
{
  "@anthropic-ai/sdk": "^0.24.3",
  "@google/generative-ai": "^0.15.0", 
  "@pinecone-database/pinecone": "^2.2.2",
  "openai": "^4.52.7",
  "jsonwebtoken": "^9.0.0",
  "uuid": "^9.0.0"
}
```

## Backend Integration

### User Hash System
The frontend now generates a `userHash` for each user that is sent to the backend. This hash enables:

1. **Automatic Memory Integration**: Backend LLM calls can automatically include relevant user memories
2. **User Isolation**: Secure separation of user data in the vector database
3. **Personalization**: Context-aware responses based on user history

### API Integration Flow
```
Frontend → API Call with userHash → Backend LLM SDK → Enhanced Response
```

## Migration Benefits

### Security
- ✅ API keys no longer exposed in frontend
- ✅ User data processing happens server-side
- ✅ Secure session management

### Performance  
- ✅ Reduced frontend bundle size
- ✅ Server-side caching and optimization
- ✅ Better error handling and retry logic

### Scalability
- ✅ Centralized LLM provider management
- ✅ Shared memory and session state
- ✅ Better resource utilization

## Frontend Changes

### Removed Files
- `src/sdk/OnairosClient.js` (152 lines)
- `src/sdk/LLMWrapper.js` (221 lines) 
- `src/sdk/MemoryManager.js` (290 lines)
- `src/sdk/SessionManager.js` (257 lines)

### Added Features
- User hash generation in `DataRequest.js`
- Simplified data request flow (Basic Info + Memories)
- Enhanced API response handling with user hash

## Backend SDK Usage

The backend Onairos SDK can now be used to automatically enhance LLM calls with user context:

```javascript
// Backend usage example
const onairos = new OnairosClient({
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  pineconeApiKey: process.env.PINECONE_API_KEY,
  // ... other config
});

// Enhanced completion with user memory
const response = await onairos.completions({
  model: 'gpt-4',
  messages: [...],
  userId: userHash, // From frontend
  sessionToken: sessionToken
});
```

## Data Flow

1. **User Interaction**: User approves data sharing in frontend
2. **Hash Generation**: Frontend generates unique `userHash` 
3. **API Call**: Data sent to backend with `userHash`
4. **Memory Integration**: Backend SDK automatically retrieves relevant user memories
5. **Enhanced Response**: LLM response includes personalized context
6. **Memory Storage**: New interactions stored for future personalization

---

**Migration Date**: December 2024  
**Reason**: Security, performance, and enhanced RAG capabilities  
**Status**: ✅ Complete - SDK fully operational in backend environment 