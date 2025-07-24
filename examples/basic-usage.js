#!/usr/bin/env node
/**
 * Example script demonstrating mirror-mcp usage
 * This shows how to use mirror-mcp as a standalone MCP server
 */

const { spawn } = require('child_process');
const path = require('path');

// Example MCP requests to test the server
const testCases = [
  // List available tools
  {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  },
  
  // Test basic reflection
  {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'reflect',
      arguments: {
        question: 'How confident am I in my reasoning about this problem?',
        context: 'I just analyzed a complex dataset and found a 23% improvement in user engagement.'
      }
    }
  },
  
  // Test reflection with custom parameters
  {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'reflect',
      arguments: {
        question: 'What potential biases might affect my analysis?',
        context: 'Working on a machine learning model for predictive analytics',
        max_tokens: 300,
        temperature: 0.6
      }
    }
  }
];

async function runExample() {
  console.log('🪞 Mirror MCP Example\n');
  console.log('This example demonstrates the reflect tool in action.\n');
  
  const serverPath = path.join(__dirname, '..', 'dist', 'cli.js');
  
  for (const [index, testCase] of testCases.entries()) {
    console.log(`--- Test Case ${index + 1}: ${getTestDescription(testCase)} ---`);
    
    try {
      const result = await sendMCPRequest(serverPath, testCase);
      console.log('Request:', JSON.stringify(testCase, null, 2));
      console.log('Response:', result);
      console.log('');
    } catch (error) {
      console.error('Error:', error.message);
      console.log('');
    }
  }
}

function getTestDescription(testCase) {
  if (testCase.method === 'tools/list') {
    return 'List Tools';
  } else if (testCase.method === 'tools/call') {
    return `Reflect: "${testCase.params.arguments.question}"`;
  }
  return 'Unknown';
}

function sendMCPRequest(serverPath, request) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    server.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    server.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    server.on('close', (code) => {
      if (code === 0) {
        // Filter out the stderr logging message
        const lines = stdout.split('\n').filter(line => 
          line.trim() && !line.includes('Mirror MCP server running')
        );
        resolve(lines.join('\n'));
      } else {
        reject(new Error(`Server exited with code ${code}\nStderr: ${stderr}`));
      }
    });
    
    server.on('error', (error) => {
      reject(error);
    });
    
    // Send the request
    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
    
    // Set a timeout
    setTimeout(() => {
      server.kill();
      reject(new Error('Request timed out'));
    }, 5000);
  });
}

if (require.main === module) {
  runExample().catch(console.error);
}