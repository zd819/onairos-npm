import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { extractMemory } from '../utils/extractMemory.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Memory Manager for RAG functionality
 * Handles vector storage, memory extraction, and retrieval
 */
export class MemoryManager {
  constructor({ pineconeApiKey, pineconeEnvironment, indexName, openaiApiKey }) {
    this.pinecone = new Pinecone({
      apiKey: pineconeApiKey,
      environment: pineconeEnvironment
    });
    
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.indexName = indexName || 'onairos-memory';
    this.index = null;
    this.embeddingModel = 'text-embedding-3-small';
    this.embeddingDimension = 1536;
  }

  /**
   * Initialize the memory manager and create index if needed
   */
  async initialize() {
    try {
      // Check if index exists
      const indexList = await this.pinecone.listIndexes();
      const indexExists = indexList.indexes?.some(index => index.name === this.indexName);

      if (!indexExists) {
        // Create index if it doesn't exist
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: this.embeddingDimension,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });

        // Wait for index to be ready
        await this._waitForIndexReady();
      }

      this.index = this.pinecone.index(this.indexName);
    } catch (error) {
      console.warn(`Failed to initialize Pinecone index: ${error.message}`);
      // Continue without vector storage for development
    }
  }

  /**
   * Wait for index to be ready
   */
  async _waitForIndexReady() {
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        const indexStats = await this.pinecone.describeIndex(this.indexName);
        if (indexStats.status?.ready) {
          return;
        }
      } catch (error) {
        // Index might not be ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }
    
    throw new Error('Index failed to become ready within timeout');
  }

  /**
   * Generate embedding for text using OpenAI
   * @param {string} text - Text to embed
   * @returns {Promise<Array>} Embedding vector
   */
  async getEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text.substring(0, 8000), // Limit text length
        encoding_format: 'float'
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error.message);
      return null;
    }
  }

  /**
   * Store interaction in vector database
   * @param {string} userId - User identifier
   * @param {string} query - User query
   * @param {string} response - Assistant response
   */
  async storeInteraction(userId, query, response) {
    try {
      // Extract selected memory data (not raw interactions)
      const memoryData = extractMemory({ query, response });
      
      if (!memoryData || !this.index) {
        return; // Skip if no meaningful memory or no index
      }

      // Generate embedding for the memory data
      const embedding = await this.getEmbedding(memoryData);
      
      if (!embedding) {
        return; // Skip if embedding generation failed
      }

      // Store in vector database
      const vectorId = `${userId}-${uuidv4()}`;
      
      await this.index.upsert([{
        id: vectorId,
        values: embedding,
        metadata: {
          userId,
          data: memoryData,
          timestamp: new Date().toISOString(),
          query: query.substring(0, 500), // Store truncated query for context
          type: 'memory'
        }
      }]);

      console.log(`Stored memory for user ${userId}: ${memoryData.substring(0, 100)}...`);
    } catch (error) {
      console.error('Failed to store interaction:', error.message);
    }
  }

  /**
   * Retrieve relevant memory for a query using RAG
   * @param {string} userId - User identifier
   * @param {string} query - Current query
   * @returns {Promise<Array>} Array of relevant memory data
   */
  async retrieveMemory(userId, query) {
    try {
      if (!this.index || !query.trim()) {
        return [];
      }

      // Generate embedding for the query
      const queryEmbedding = await this.getEmbedding(query);
      
      if (!queryEmbedding) {
        return [];
      }

      // Search for similar memories
      const searchResults = await this.index.query({
        vector: queryEmbedding,
        topK: 5,
        filter: {
          userId: { $eq: userId },
          type: { $eq: 'memory' }
        },
        includeMetadata: true
      });

      // Extract and return relevant memory data
      const memories = searchResults.matches
        .filter(match => match.score > 0.7) // Only high-confidence matches
        .map(match => match.metadata.data)
        .filter(data => data && data.length > 0);

      return [...new Set(memories)]; // Remove duplicates
    } catch (error) {
      console.error('Failed to retrieve memory:', error.message);
      return [];
    }
  }

  /**
   * Clear all memory for a specific user
   * @param {string} userId - User identifier
   */
  async clearUserMemory(userId) {
    try {
      if (!this.index) {
        return;
      }

      // Query all vectors for the user
      const queryResults = await this.index.query({
        vector: new Array(this.embeddingDimension).fill(0),
        topK: 10000,
        filter: {
          userId: { $eq: userId }
        },
        includeMetadata: false
      });

      // Delete all user vectors
      const vectorIds = queryResults.matches.map(match => match.id);
      
      if (vectorIds.length > 0) {
        await this.index.deleteMany(vectorIds);
        console.log(`Cleared ${vectorIds.length} memory entries for user ${userId}`);
      }
    } catch (error) {
      console.error('Failed to clear user memory:', error.message);
    }
  }

  /**
   * Get user memory summary
   * @param {string} userId - User identifier
   * @returns {Promise<Array>} Array of memory entries with metadata
   */
  async getUserMemory(userId) {
    try {
      if (!this.index) {
        return [];
      }

      const queryResults = await this.index.query({
        vector: new Array(this.embeddingDimension).fill(0),
        topK: 100,
        filter: {
          userId: { $eq: userId },
          type: { $eq: 'memory' }
        },
        includeMetadata: true
      });

      return queryResults.matches.map(match => ({
        id: match.id,
        data: match.metadata.data,
        timestamp: match.metadata.timestamp,
        query: match.metadata.query
      }));
    } catch (error) {
      console.error('Failed to get user memory:', error.message);
      return [];
    }
  }

  /**
   * Store custom memory entry
   * @param {string} userId - User identifier
   * @param {string} memoryData - Memory data to store
   * @param {string} category - Memory category (optional)
   */
  async storeCustomMemory(userId, memoryData, category = 'custom') {
    try {
      if (!this.index || !memoryData.trim()) {
        return;
      }

      const embedding = await this.getEmbedding(memoryData);
      
      if (!embedding) {
        return;
      }

      const vectorId = `${userId}-${category}-${uuidv4()}`;
      
      await this.index.upsert([{
        id: vectorId,
        values: embedding,
        metadata: {
          userId,
          data: memoryData,
          timestamp: new Date().toISOString(),
          category,
          type: 'memory'
        }
      }]);

      console.log(`Stored custom memory for user ${userId}: ${memoryData.substring(0, 100)}...`);
    } catch (error) {
      console.error('Failed to store custom memory:', error.message);
    }
  }
} 