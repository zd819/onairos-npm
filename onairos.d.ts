declare module 'onairos' {
    export interface OnairosProps {
      requestData: any; // Consider using a more specific type or interface for request data.
      webpageName: string;
      inferenceData?: any;
      onComplete?: (data: any, error?: Error) => void; // Specify more precise types if possible.
      autoFetch?: boolean;
      proofMode?: boolean;
      textLayout?: 'right' | 'left' | 'below' | 'none';
      textColor?: 'black' | 'white';
      login?: boolean,
      loginReturn?:(data: any, error?: Error) => void;
      loginType?: string;
      visualType?: string;
    }
    
  
    /**
     * Creates an Onairos component with various configuration options for fetching and displaying user data.
     */
    export function Onairos(props: OnairosProps): JSX.Element;

    // SDK Interfaces
    export interface OnairosClientConfig {
      openaiApiKey?: string;
      anthropicApiKey?: string;
      googleApiKey?: string;
      pineconeApiKey?: string;
      pineconeEnvironment?: string;
      jwtSecret: string;
      indexName?: string;
    }

    export interface CompletionMessage {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }

    export interface CompletionOptions {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      frequency_penalty?: number;
      presence_penalty?: number;
    }

    export interface CompletionParams {
      model: string;
      messages: CompletionMessage[];
      userId: string;
      sessionToken: string;
      options?: CompletionOptions;
    }

    export interface CompletionResponse {
      id: string;
      object: string;
      created: number;
      model: string;
      choices: Array<{
        index: number;
        message: {
          role: string;
          content: string;
        };
        finish_reason: string;
      }>;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    }

    export interface MemoryEntry {
      id: string;
      data: string;
      timestamp: string;
      query?: string;
    }

    export interface SessionTokenOptions {
      expiresIn?: string;
      additionalClaims?: Record<string, any>;
    }

    /**
     * Main Onairos SDK Client for RAG-enhanced completions
     */
    export class OnairosClient {
      constructor(config: OnairosClientConfig);
      
      /**
       * Initialize the client (sets up vector store)
       */
      initialize(): Promise<void>;
      
      /**
       * Create a completion with RAG enhancement
       */
      completions(params: CompletionParams): Promise<CompletionResponse>;
      
      /**
       * Create a completion (alias for completions)
       */
      create(params: CompletionParams): Promise<CompletionResponse>;
      
      /**
       * Generate a session token for a user
       */
      generateSessionToken(userId: string, options?: SessionTokenOptions): string;
      
      /**
       * Clear memory for a specific user
       */
      clearUserMemory(userId: string): Promise<void>;
      
      /**
       * Get user memory summary
       */
      getUserMemory(userId: string): Promise<MemoryEntry[]>;
    }

    /**
     * LLM Wrapper for multiple providers
     */
    export class LLMWrapper {
      constructor(config: {
        openaiApiKey?: string;
        anthropicApiKey?: string;
        googleApiKey?: string;
      });
      
      createCompletion(params: {
        model: string;
        messages: CompletionMessage[];
        options?: CompletionOptions;
      }): Promise<{
        id: string;
        content: string;
        finish_reason: string;
        usage?: any;
      }>;
      
      getAvailableModels(): {
        openai: string[];
        anthropic: string[];
        google: string[];
      };
    }

    /**
     * Memory Manager for RAG functionality
     */
    export class MemoryManager {
      constructor(config: {
        pineconeApiKey: string;
        pineconeEnvironment: string;
        indexName?: string;
        openaiApiKey: string;
      });
      
      initialize(): Promise<void>;
      storeInteraction(userId: string, query: string, response: string): Promise<void>;
      retrieveMemory(userId: string, query: string): Promise<string[]>;
      clearUserMemory(userId: string): Promise<void>;
      getUserMemory(userId: string): Promise<MemoryEntry[]>;
      storeCustomMemory(userId: string, memoryData: string, category?: string): Promise<void>;
    }

    /**
     * Session Manager for authentication
     */
    export class SessionManager {
      constructor(config: { jwtSecret: string });
      
      generateSessionToken(userId: string, options?: SessionTokenOptions): string;
      validateSession(token: string): Promise<any>;
      refreshSession(token: string, options?: any): Promise<string>;
      extractUserId(token: string): string | null;
      isTokenExpired(token: string): boolean;
      getTokenExpiration(token: string): Date | null;
      generateGuestToken(options?: any): string;
      validateUserAccess(token: string, expectedUserId: string): Promise<any>;
      generateApiKey(clientId: string, scopes?: string[]): string;
      validateApiKey(apiKey: string): Promise<any>;
    }

    // Utility functions
    export function extractMemory(params: { query: string; response: string }): string | null;
    export function hasMeaningfulMemory(query: string, response: string): boolean;
    export function cleanMemoryData(memoryData: string): string;
  }
  