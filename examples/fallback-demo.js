#!/usr/bin/env node
/**
 * Fallback reflection example
 * Shows how mirror-mcp handles reflection when MCP sampling is not available
 */

const { ReflectionEngine } = require('../dist/reflection-engine.js');

// Mock server that always fails sampling (simulates no MCP client)
class MockServer {
  async request() {
    throw new Error('No MCP client available for sampling');
  }
}

async function demonstrateFallbackReflection() {
  console.log('🪞 Mirror MCP - Fallback Reflection Demo\n');
  console.log('This demonstrates how mirror-mcp provides thoughtful fallback reflections');
  console.log('when MCP sampling is not available (e.g., no client connected).\n');
  
  const reflectionEngine = new ReflectionEngine();
  const mockServer = new MockServer();
  
  const testCases = [
    {
      question: 'How confident am I in my analysis of this data?',
      context: 'I found a 23% increase in user engagement after implementing the new feature.'
    },
    {
      question: 'What potential biases might be affecting my reasoning?',
      context: 'Analyzing machine learning model performance across different demographic groups.',
      max_tokens: 300,
      temperature: 0.6
    },
    {
      question: 'What are the limitations of my current approach?',
      max_tokens: 200
    }
  ];
  
  for (const [index, testCase] of testCases.entries()) {
    console.log(`--- Reflection ${index + 1} ---`);
    console.log(`Question: "${testCase.question}"`);
    if (testCase.context) {
      console.log(`Context: ${testCase.context}`);
    }
    console.log('');
    
    try {
      const startTime = Date.now();
      const result = await reflectionEngine.reflect(testCase, mockServer);
      const endTime = Date.now();
      
      console.log('Reflection:');
      console.log(result.reflection);
      console.log('');
      console.log(`Metadata:`);
      console.log(`- Tokens used: ${result.tokensUsed}`);
      console.log(`- Processing time: ${endTime - startTime}ms`);
      console.log('');
      
    } catch (error) {
      console.error('Error:', error.message);
      console.log('');
    }
  }
  
  console.log('Note: In a real MCP environment with a connected client, these questions');
  console.log('would be sent to the client for LLM sampling, potentially producing');
  console.log('more sophisticated and context-aware reflections.');
}

if (require.main === module) {
  demonstrateFallbackReflection().catch(console.error);
}