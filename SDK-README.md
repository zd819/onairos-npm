# Onairos SDK

A unified SDK that wraps OpenAI, Anthropic Claude, and Google Gemini APIs with built-in RAG (Retrieval-Augmented Generation) capabilities for personalized AI interactions.

## 🚀 Features

- **Unified API**: Single interface for OpenAI, Anthropic, and Google Gemini
- **RAG Enhancement**: Automatic memory storage and retrieval for personalized responses
- **Drop-in Replacement**: Minimal code changes from existing OpenAI implementations
- **Session Management**: JWT-based user authentication and isolation
- **Privacy-Focused**: Stores selected memory data, not raw conversations
- **Multi-Provider Support**: Seamlessly switch between different LLM providers
- **Memory Management**: Built-in vector storage with Pinecone integration

## 📦 Installation

```bash
npm install onairos
```

## 🔧 Setup

### Environment Variables

Create a `.env` file with your API keys:

```env
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment
JWT_SECRET=your-super-secret-jwt-key
```

### Basic Setup

```javascript
import { OnairosClient } from 'onairos';

const onairos = new OnairosClient({
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY, // Optional
  googleApiKey: process.env.GOOGLE_API_KEY, // Optional
  pineconeApiKey: process.env.PINECONE_API_KEY,
  pineconeEnvironment: process.env.PINECONE_ENVIRONMENT,
  jwtSecret: process.env.JWT_SECRET
});

// Initialize the SDK
await onairos.initialize();
```

## 🔄 Migration from OpenAI

### Before (OpenAI)
```javascript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'What is artificial intelligence?' }
  ]
});
```

### After (Onairos)
```javascript
import { OnairosClient } from 'onairos';
const onairos = new OnairosClient(config);

const userId = 'user-123';
const sessionToken = onairos.generateSessionToken(userId);

const response = await onairos.completions({
  model: 'gpt-4', // or 'claude-3-sonnet-20240229' or 'gemini-pro'
  messages: [
    { role: 'user', content: 'What is artificial intelligence?' }
  ],
  userId,
  sessionToken
});
```

## 🎯 Usage Examples

### Basic Completion

```javascript
const response = await onairos.completions({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Hello, how are you?' }
  ],
  userId: 'user-123',
  sessionToken: sessionToken,
  options: {
    temperature: 0.7,
    max_tokens: 150
  }
});

console.log(response.choices[0].message.content);
```

### Multi-Provider Usage

```javascript
// OpenAI GPT-4
const gptResponse = await onairos.completions({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
  userId, sessionToken
});

// Anthropic Claude
const claudeResponse = await onairos.completions({
  model: 'claude-3-sonnet-20240229',
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
  userId, sessionToken
});

// Google Gemini
const geminiResponse = await onairos.completions({
  model: 'gemini-pro',
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
  userId, sessionToken
});
```

### RAG Memory Enhancement

The SDK automatically stores and retrieves relevant user context:

```javascript
// First interaction - stores user preference
await onairos.completions({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'My favorite programming language is Python' }],
  userId, sessionToken
});

// Later interaction - automatically uses stored context
const response = await onairos.completions({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'What language should I use for my next project?' }],
  userId, sessionToken
});
// Response will consider the user's Python preference
```

### Memory Management

```javascript
// Get user's stored memories
const memories = await onairos.getUserMemory(userId);
console.log(`User has ${memories.length} stored memories`);

// Clear user's memory
await onairos.clearUserMemory(userId);

// Store custom memory
await onairos.memoryManager.storeCustomMemory(
  userId, 
  "User prefers concise explanations", 
  "preference"
);
```

### Session Management

```javascript
// Generate session token
const sessionToken = onairos.generateSessionToken(userId, {
  expiresIn: '24h',
  additionalClaims: { role: 'premium' }
});

// Validate session
try {
  const decoded = await onairos.sessionManager.validateSession(sessionToken);
  console.log('Valid session for user:', decoded.userId);
} catch (error) {
  console.log('Invalid session:', error.message);
}

// Generate guest token
const guestToken = onairos.sessionManager.generateGuestToken();
```

## 🤖 Supported Models

### OpenAI
- `gpt-4`
- `gpt-4-turbo`
- `gpt-3.5-turbo`
- `o1-preview`
- `o1-mini`

### Anthropic
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`
- `claude-3-5-sonnet-20241022`

### Google
- `gemini-pro`
- `gemini-pro-vision`
- `gemini-1.5-pro`
- `gemini-1.5-flash`

## 🧠 How RAG Works

1. **Memory Extraction**: After each interaction, the SDK extracts meaningful information (preferences, goals, context) rather than storing raw conversations
2. **Vector Storage**: Extracted memories are embedded and stored in Pinecone vector database
3. **Context Retrieval**: Before each new query, relevant memories are retrieved using semantic search
4. **Prompt Enhancement**: Retrieved context is automatically injected into the prompt
5. **Privacy Protection**: Only selected, meaningful data is stored, ensuring user privacy

## 🔒 Security Features

- **JWT Authentication**: Secure session management with configurable expiration
- **User Isolation**: Each user's memory is completely isolated
- **Privacy-First**: Only meaningful insights are stored, not raw conversations
- **Session Validation**: All requests require valid session tokens
- **API Key Management**: Secure handling of multiple provider API keys

## 📊 Response Format

The SDK returns responses in OpenAI-compatible format:

```javascript
{
  "id": "onairos-1234567890",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Response content here..."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

## 🛠️ Advanced Configuration

### Custom Memory Extraction

```javascript
import { extractMemory } from 'onairos';

// Custom memory extraction logic
const customMemory = extractMemory({
  query: "I love hiking in the mountains",
  response: "That's great! Mountain hiking is excellent exercise..."
});
```

### Direct Component Access

```javascript
import { LLMWrapper, MemoryManager, SessionManager } from 'onairos';

// Use components independently
const llm = new LLMWrapper({ openaiApiKey: 'your-key' });
const memory = new MemoryManager({ pineconeApiKey: 'your-key' });
const session = new SessionManager({ jwtSecret: 'your-secret' });
```

## 🧪 Testing

Run the test suite:

```bash
node test-sdk.js
```

Or run the simple example:

```bash
node example-usage.js
```

## 📝 TypeScript Support

The SDK includes full TypeScript definitions:

```typescript
import { OnairosClient, CompletionParams, CompletionResponse } from 'onairos';

const client: OnairosClient = new OnairosClient(config);

const params: CompletionParams = {
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }],
  userId: 'user-123',
  sessionToken: 'token'
};

const response: CompletionResponse = await client.completions(params);
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@onairos.uk
- 🌐 Website: https://onairos.uk
- 📚 Documentation: https://docs.onairos.uk
- 🐛 Issues: https://github.com/zd819/onairos-npm/issues

## 🎉 Benefits

✅ **Unified API** - One interface for all major LLM providers  
✅ **RAG Enhancement** - Automatic personalization with memory  
✅ **Drop-in Replacement** - Minimal migration effort  
✅ **Privacy-Focused** - Selective memory storage  
✅ **Session Security** - JWT-based authentication  
✅ **Multi-Provider** - Switch between models seamlessly  
✅ **Production Ready** - Built for scale and reliability  

---

Made with ❤️ by the Onairos team 