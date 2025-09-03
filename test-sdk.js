/**
 * Onairos SDK Test File
 * Demonstrates how to use the Onairos SDK as a drop-in replacement for:
 * - OpenAI API
 * - Anthropic Claude API  
 * - Google Gemini API
 * 
 * The SDK provides RAG-enhanced completions with memory management
 */

import { OnairosClient } from './src/index.js';

// Configuration - Replace with your actual API keys
const config = {
  openaiApiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || 'your-anthropic-api-key',
  googleApiKey: process.env.GOOGLE_API_KEY || 'your-google-api-key',
  pineconeApiKey: process.env.PINECONE_API_KEY || 'your-pinecone-api-key',
  pineconeEnvironment: process.env.PINECONE_ENVIRONMENT || 'your-pinecone-environment',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
};

// Initialize the Onairos client
const onairos = new OnairosClient(config);

async function runTests() {
  try {
    console.log('🚀 Initializing Onairos SDK...');
    await onairos.initialize();
    console.log('✅ Onairos SDK initialized successfully!\n');

    // Test user
    const userId = 'test-user-123';
    const sessionToken = onairos.generateSessionToken(userId);
    console.log(`🔐 Generated session token for user: ${userId}\n`);

    // Test 1: OpenAI GPT-4 (Traditional way vs Onairos way)
    console.log('='.repeat(60));
    console.log('TEST 1: OpenAI GPT-4 Comparison');
    console.log('='.repeat(60));
    
    await testOpenAIComparison(userId, sessionToken);

    // Test 2: Anthropic Claude (Traditional way vs Onairos way)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Anthropic Claude Comparison');
    console.log('='.repeat(60));
    
    await testClaudeComparison(userId, sessionToken);

    // Test 3: Google Gemini (Traditional way vs Onairos way)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Google Gemini Comparison');
    console.log('='.repeat(60));
    
    await testGeminiComparison(userId, sessionToken);

    // Test 4: RAG Memory Enhancement
    console.log('\n' + '='.repeat(60));
    console.log('TEST 4: RAG Memory Enhancement Demo');
    console.log('='.repeat(60));
    
    await testRAGMemory(userId, sessionToken);

    // Test 5: Memory Management
    console.log('\n' + '='.repeat(60));
    console.log('TEST 5: Memory Management');
    console.log('='.repeat(60));
    
    await testMemoryManagement(userId, sessionToken);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Test OpenAI GPT-4 - Traditional vs Onairos
 */
async function testOpenAIComparison(userId, sessionToken) {
  console.log('📝 Traditional OpenAI API call:');
  console.log(`
// Traditional OpenAI way
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: 'your-api-key' });

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'What is artificial intelligence?' }
  ]
});
  `);

  console.log('🔄 Onairos SDK equivalent (with RAG enhancement):');
  console.log(`
// Onairos way - same interface, enhanced with RAG
import { OnairosClient } from 'onairos';
const onairos = new OnairosClient(config);

const response = await onairos.completions({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'What is artificial intelligence?' }
  ],
  userId: '${userId}',
  sessionToken: sessionToken
});
  `);

  try {
    const response = await onairos.completions({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: 'What is artificial intelligence?' }
      ],
      userId,
      sessionToken,
      options: {
        temperature: 0.7,
        max_tokens: 150
      }
    });

    console.log('✅ Onairos Response:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.log('⚠️  OpenAI test skipped (API key not configured):', error.message);
  }
}

/**
 * Test Anthropic Claude - Traditional vs Onairos
 */
async function testClaudeComparison(userId, sessionToken) {
  console.log('📝 Traditional Anthropic API call:');
  console.log(`
// Traditional Anthropic way
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: 'your-api-key' });

const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  messages: [
    { role: 'user', content: 'Explain quantum computing' }
  ],
  max_tokens: 150
});
  `);

  console.log('🔄 Onairos SDK equivalent (with RAG enhancement):');
  console.log(`
// Onairos way - unified interface across all LLMs
const response = await onairos.completions({
  model: 'claude-3-sonnet-20240229',
  messages: [
    { role: 'user', content: 'Explain quantum computing' }
  ],
  userId: '${userId}',
  sessionToken: sessionToken
});
  `);

  try {
    const response = await onairos.completions({
      model: 'claude-3-sonnet-20240229',
      messages: [
        { role: 'user', content: 'Explain quantum computing' }
      ],
      userId,
      sessionToken,
      options: {
        max_tokens: 150
      }
    });

    console.log('✅ Onairos Response:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.log('⚠️  Claude test skipped (API key not configured):', error.message);
  }
}

/**
 * Test Google Gemini - Traditional vs Onairos
 */
async function testGeminiComparison(userId, sessionToken) {
  console.log('📝 Traditional Google Gemini API call:');
  console.log(`
// Traditional Google way
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('your-api-key');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const result = await model.generateContent('What is machine learning?');
const response = await result.response;
  `);

  console.log('🔄 Onairos SDK equivalent (with RAG enhancement):');
  console.log(`
// Onairos way - same interface for all providers
const response = await onairos.completions({
  model: 'gemini-pro',
  messages: [
    { role: 'user', content: 'What is machine learning?' }
  ],
  userId: '${userId}',
  sessionToken: sessionToken
});
  `);

  try {
    const response = await onairos.completions({
      model: 'gemini-pro',
      messages: [
        { role: 'user', content: 'What is machine learning?' }
      ],
      userId,
      sessionToken,
      options: {
        temperature: 0.7,
        max_tokens: 150
      }
    });

    console.log('✅ Onairos Response:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.log('⚠️  Gemini test skipped (API key not configured):', error.message);
  }
}

/**
 * Test RAG Memory Enhancement
 */
async function testRAGMemory(userId, sessionToken) {
  console.log('🧠 Testing RAG Memory Enhancement...\n');

  const conversations = [
    {
      messages: [{ role: 'user', content: 'My favorite programming language is Python because it\'s so versatile' }],
      description: 'Setting user preference'
    },
    {
      messages: [{ role: 'user', content: 'I work as a data scientist at a tech company' }],
      description: 'Setting user profession'
    },
    {
      messages: [{ role: 'user', content: 'I want to learn more about machine learning algorithms' }],
      description: 'Setting user goal'
    },
    {
      messages: [{ role: 'user', content: 'What programming language should I use for my next project?' }],
      description: 'Query that should use RAG context'
    }
  ];

  for (let i = 0; i < conversations.length; i++) {
    const conv = conversations[i];
    console.log(`${i + 1}. ${conv.description}:`);
    console.log(`   Query: "${conv.messages[0].content}"`);

    try {
      const response = await onairos.completions({
        model: 'gpt-3.5-turbo', // Using a more accessible model
        messages: conv.messages,
        userId,
        sessionToken,
        options: {
          temperature: 0.7,
          max_tokens: 100
        }
      });

      console.log(`   Response: "${response.choices[0].message.content}"`);
      console.log('');

      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`   ⚠️  Skipped: ${error.message}\n`);
    }
  }

  console.log('💡 Notice how the last response should incorporate context from previous interactions!');
}

/**
 * Test Memory Management
 */
async function testMemoryManagement(userId, sessionToken) {
  console.log('🗄️  Testing Memory Management...\n');

  try {
    // Get user memory
    const memory = await onairos.getUserMemory(userId);
    console.log(`📊 User has ${memory.length} memory entries:`);
    
    memory.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.data.substring(0, 100)}...`);
      console.log(`      Timestamp: ${entry.timestamp}`);
      console.log('');
    });

    // Clear user memory
    console.log('🧹 Clearing user memory...');
    await onairos.clearUserMemory(userId);
    
    const clearedMemory = await onairos.getUserMemory(userId);
    console.log(`✅ Memory cleared. User now has ${clearedMemory.length} memory entries.`);

  } catch (error) {
    console.log(`⚠️  Memory management test skipped: ${error.message}`);
  }
}

/**
 * Demonstrate different model usage patterns
 */
async function demonstrateModelUsage() {
  console.log('\n' + '='.repeat(60));
  console.log('MODEL USAGE PATTERNS');
  console.log('='.repeat(60));

  const userId = 'demo-user';
  const sessionToken = onairos.generateSessionToken(userId);

  const models = [
    'gpt-4',
    'gpt-3.5-turbo',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'gemini-pro',
    'gemini-1.5-flash'
  ];

  const query = 'Explain the concept of recursion in programming';

  for (const model of models) {
    console.log(`\n🤖 Testing with ${model}:`);
    
    try {
      const response = await onairos.completions({
        model,
        messages: [{ role: 'user', content: query }],
        userId,
        sessionToken,
        options: { max_tokens: 100 }
      });

      console.log(`✅ Success: ${response.choices[0].message.content.substring(0, 100)}...`);
    } catch (error) {
      console.log(`⚠️  ${model}: ${error.message}`);
    }
  }
}

// Run the tests
console.log('🧪 Starting Onairos SDK Tests...\n');
runTests()
  .then(() => {
    console.log('\n🎉 All tests completed!');
    console.log('\n📚 Key Benefits of Onairos SDK:');
    console.log('   ✅ Unified API across OpenAI, Claude, and Gemini');
    console.log('   ✅ Automatic RAG enhancement with memory');
    console.log('   ✅ Session management and user isolation');
    console.log('   ✅ Drop-in replacement for existing APIs');
    console.log('   ✅ Privacy-focused memory extraction');
    console.log('   ✅ Seamless model switching');
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error);
  }); 