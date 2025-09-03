/**
 * Simple Onairos SDK Usage Example
 * Shows how easy it is to replace OpenAI with Onairos
 */

import { OnairosClient } from 'onairos';

// BEFORE: Traditional OpenAI usage
/*
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Hello, how are you?' }
  ]
});
*/

// AFTER: Onairos SDK usage (with RAG enhancement)
const onairos = new OnairosClient({
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY, // Optional
  googleApiKey: process.env.GOOGLE_API_KEY, // Optional
  pineconeApiKey: process.env.PINECONE_API_KEY,
  pineconeEnvironment: process.env.PINECONE_ENVIRONMENT,
  jwtSecret: process.env.JWT_SECRET
});

async function main() {
  // Initialize the SDK
  await onairos.initialize();
  
  // Create a user session
  const userId = 'user-123';
  const sessionToken = onairos.generateSessionToken(userId);
  
  // Make the same API call, but now with RAG enhancement
  const response = await onairos.completions({
    model: 'gpt-4', // or 'claude-3-sonnet-20240229' or 'gemini-pro'
    messages: [
      { role: 'user', content: 'Hello, how are you?' }
    ],
    userId,
    sessionToken
  });
  
  console.log(response.choices[0].message.content);
  
  // The SDK automatically:
  // 1. Retrieves relevant user memory using RAG
  // 2. Enhances the prompt with context
  // 3. Stores meaningful memory for future interactions
  // 4. Provides the same response format as OpenAI
}

main().catch(console.error); 