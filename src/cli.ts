#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ReflectionEngine } from './reflection-engine';

const server = new Server(
  {
    name: 'mirror-mcp',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {},
      sampling: {},
    },
  }
);

const reflectionEngine = new ReflectionEngine();

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'reflect',
        description: 'Enable LLM self-reflection by asking questions and receiving computed responses through MCP sampling',
        inputSchema: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description: 'The question the LLM wants to ask itself',
            },
            context: {
              type: 'string',
              description: 'Additional context for the reflection',
            },
            system_prompt: {
              type: 'string',
              description: 'Custom system prompt to direct the reflection approach',
            },
            user_prompt: {
              type: 'string',
              description: 'Custom user prompt to replace the default reflection instructions',
            },
            max_tokens: {
              type: 'number',
              description: 'Maximum tokens for the response',
              default: 500,
            },
            temperature: {
              type: 'number',
              description: 'Sampling temperature',
              default: 0.8,
              minimum: 0,
              maximum: 2,
            },
          },
          required: ['question'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'reflect') {
    try {
      // Validate and cast args
      if (!args || typeof args !== 'object') {
        throw new Error('Invalid arguments provided');
      }
      
      const reflectionArgs = args as any; // We'll validate in the reflection engine
      const startTime = Date.now();
      const result = await reflectionEngine.reflect(reflectionArgs, server);
      const endTime = Date.now();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              reflection: result.reflection,
              metadata: {
                tokens_used: result.tokensUsed,
                reflection_time_ms: endTime - startTime,
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to generate reflection',
              details: error instanceof Error ? error.message : 'Unknown error',
            }),
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Mirror MCP server running on stdio');
}

// Check if this file is being run directly
const isMainModule = require.main === module;

if (isMainModule) {
  main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}

export { server };