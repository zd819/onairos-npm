import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * LLM Wrapper that provides unified interface for multiple LLM providers
 * Supports OpenAI, Anthropic Claude, and Google Gemini
 */
export class LLMWrapper {
  constructor({ openaiApiKey, anthropicApiKey, googleApiKey }) {
    // Initialize OpenAI client
    this.openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
    
    // Initialize Anthropic client
    this.anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null;
    
    // Initialize Google Gemini client
    this.google = googleApiKey ? new GoogleGenerativeAI(googleApiKey) : null;
  }

  /**
   * Create a completion using the specified model
   * @param {Object} params - Completion parameters
   * @param {string} params.model - Model name
   * @param {Array} params.messages - Messages array
   * @param {Object} params.options - Additional options
   * @returns {Promise<Object>} Standardized response
   */
  async createCompletion({ model, messages, options = {} }) {
    const modelLower = model.toLowerCase();

    // OpenAI models
    if (modelLower.includes('gpt') || modelLower.includes('o1')) {
      return this._createOpenAICompletion({ model, messages, options });
    }
    
    // Anthropic models
    if (modelLower.includes('claude')) {
      return this._createAnthropicCompletion({ model, messages, options });
    }
    
    // Google Gemini models
    if (modelLower.includes('gemini')) {
      return this._createGoogleCompletion({ model, messages, options });
    }

    throw new Error(`Unsupported model: ${model}`);
  }

  /**
   * Create OpenAI completion
   */
  async _createOpenAICompletion({ model, messages, options }) {
    if (!this.openai) {
      throw new Error('OpenAI not configured. Please provide openaiApiKey.');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        top_p: options.top_p || 1,
        frequency_penalty: options.frequency_penalty || 0,
        presence_penalty: options.presence_penalty || 0,
        ...options
      });

      return {
        id: completion.id,
        content: completion.choices[0].message.content,
        finish_reason: completion.choices[0].finish_reason,
        usage: completion.usage
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Create Anthropic completion
   */
  async _createAnthropicCompletion({ model, messages, options }) {
    if (!this.anthropic) {
      throw new Error('Anthropic not configured. Please provide anthropicApiKey.');
    }

    try {
      // Convert messages format for Anthropic
      const anthropicMessages = this._convertMessagesForAnthropic(messages);
      
      const completion = await this.anthropic.messages.create({
        model,
        messages: anthropicMessages.messages,
        system: anthropicMessages.system,
        max_tokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 1,
        ...options
      });

      return {
        id: completion.id,
        content: completion.content[0].text,
        finish_reason: completion.stop_reason,
        usage: {
          prompt_tokens: completion.usage.input_tokens,
          completion_tokens: completion.usage.output_tokens,
          total_tokens: completion.usage.input_tokens + completion.usage.output_tokens
        }
      };
    } catch (error) {
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  /**
   * Create Google Gemini completion
   */
  async _createGoogleCompletion({ model, messages, options }) {
    if (!this.google) {
      throw new Error('Google not configured. Please provide googleApiKey.');
    }

    try {
      const geminiModel = this.google.getGenerativeModel({ model });
      
      // Convert messages to Gemini format
      const geminiMessages = this._convertMessagesForGemini(messages);
      
      const result = await geminiModel.generateContent({
        contents: geminiMessages,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.max_tokens || 1000,
          topP: options.top_p || 1,
          ...options
        }
      });

      const response = await result.response;
      
      return {
        id: `gemini-${Date.now()}`,
        content: response.text(),
        finish_reason: 'stop',
        usage: {
          prompt_tokens: 0, // Gemini doesn't provide token counts
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    } catch (error) {
      throw new Error(`Google Gemini API error: ${error.message}`);
    }
  }

  /**
   * Convert messages format for Anthropic (separate system messages)
   */
  _convertMessagesForAnthropic(messages) {
    const systemMessages = [];
    const conversationMessages = [];

    for (const message of messages) {
      if (message.role === 'system') {
        systemMessages.push(message.content);
      } else {
        conversationMessages.push({
          role: message.role,
          content: message.content
        });
      }
    }

    return {
      system: systemMessages.join('\n'),
      messages: conversationMessages
    };
  }

  /**
   * Convert messages format for Google Gemini
   */
  _convertMessagesForGemini(messages) {
    return messages.map(message => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }]
    }));
  }

  /**
   * Get available models for each provider
   */
  getAvailableModels() {
    return {
      openai: [
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4-turbo-preview',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k',
        'o1-preview',
        'o1-mini'
      ],
      anthropic: [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'claude-3-5-sonnet-20241022'
      ],
      google: [
        'gemini-pro',
        'gemini-pro-vision',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
      ]
    };
  }
} 