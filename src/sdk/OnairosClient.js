import { LLMWrapper } from './LLMWrapper.js';
import { MemoryManager } from './MemoryManager.js';
import { SessionManager } from './SessionManager.js';

/**
 * Main Onairos SDK Client
 * Provides a unified completion API with RAG-enhanced personalization
 */
export class OnairosClient {
  constructor({ 
    openaiApiKey, 
    anthropicApiKey, 
    googleApiKey,
    pineconeApiKey, 
    pineconeEnvironment, 
    jwtSecret,
    indexName = 'onairos-memory'
  }) {
    this.llmWrapper = new LLMWrapper({ 
      openaiApiKey, 
      anthropicApiKey, 
      googleApiKey 
    });
    
    this.memoryManager = new MemoryManager({ 
      pineconeApiKey, 
      pineconeEnvironment,
      indexName,
      openaiApiKey // For embeddings
    });
    
    this.sessionManager = new SessionManager({ jwtSecret });
  }

  /**
   * Initialize the client (sets up vector store)
   */
  async initialize() {
    await this.memoryManager.initialize();
  }

  /**
   * Create a completion with RAG enhancement
   * @param {Object} params - Completion parameters
   * @param {string} params.model - Model name (e.g., 'gpt-4', 'claude-3-sonnet', 'gemini-pro')
   * @param {Array} params.messages - Array of message objects
   * @param {string} params.userId - User identifier
   * @param {string} params.sessionToken - Session token for validation
   * @param {Object} params.options - Additional options (temperature, max_tokens, etc.)
   * @returns {Promise<Object>} Completion response
   */
  async completions({ model, messages, userId, sessionToken, options = {} }) {
    try {
      // Validate session
      const { userId: validatedUserId } = await this.sessionManager.validateSession(sessionToken);
      if (validatedUserId !== userId) {
        throw new Error('Invalid session: User ID mismatch');
      }

      // Extract query text from the last message
      const lastMessage = messages[messages.length - 1];
      const query = typeof lastMessage.content === 'string' 
        ? lastMessage.content 
        : lastMessage.content[0]?.text || '';

      // Retrieve relevant memory data using RAG
      const memoryContext = await this.memoryManager.retrieveMemory(userId, query);

      // Construct prompt with RAG context if memory exists
      let augmentedMessages = [...messages];
      if (memoryContext.length > 0) {
        const contextMessage = {
          role: 'system',
          content: `Context from previous interactions: ${memoryContext.join(' | ')}`
        };
        
        // Insert context before the last user message
        augmentedMessages = [
          ...messages.slice(0, -1),
          contextMessage,
          lastMessage
        ];
      }

      // Call LLM with augmented messages
      const response = await this.llmWrapper.createCompletion({ 
        model, 
        messages: augmentedMessages,
        options
      });

      // Extract and store selected memory data
      await this.memoryManager.storeInteraction(userId, query, response.content);

      return {
        id: response.id || `onairos-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: response.content
          },
          finish_reason: response.finish_reason || 'stop'
        }],
        usage: response.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };

    } catch (error) {
      throw new Error(`Onairos completion failed: ${error.message}`);
    }
  }

  /**
   * Create a completion (alias for completions for OpenAI compatibility)
   */
  async create(params) {
    return this.completions(params);
  }

  /**
   * Generate a session token for a user
   * @param {string} userId - User identifier
   * @returns {string} JWT session token
   */
  generateSessionToken(userId) {
    return this.sessionManager.generateSessionToken(userId);
  }

  /**
   * Clear memory for a specific user
   * @param {string} userId - User identifier
   */
  async clearUserMemory(userId) {
    await this.memoryManager.clearUserMemory(userId);
  }

  /**
   * Get user memory summary
   * @param {string} userId - User identifier
   * @returns {Promise<Array>} Array of memory entries
   */
  async getUserMemory(userId) {
    return this.memoryManager.getUserMemory(userId);
  }
} 