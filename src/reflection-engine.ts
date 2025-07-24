import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CreateMessageRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export interface ReflectionRequest {
  question: string;
  context?: string;
  max_tokens?: number;
  temperature?: number;
}

export interface ReflectionResult {
  reflection: string;
  tokensUsed: number;
}

export class ReflectionEngine {
  async reflect(request: ReflectionRequest, server: Server): Promise<ReflectionResult> {
    const {
      question,
      context = '',
      max_tokens = 500,
      temperature = 0.8,
    } = request;

    // Validate parameters
    if (!question || typeof question !== 'string') {
      throw new Error('Question is required and must be a string');
    }

    if (max_tokens < 1 || max_tokens > 4000) {
      throw new Error('max_tokens must be between 1 and 4000');
    }

    if (temperature < 0 || temperature > 2) {
      throw new Error('temperature must be between 0 and 2');
    }

    // Construct the reflection prompt
    const prompt = this.buildReflectionPrompt(question, context);

    try {
      // Use MCP sampling to generate the reflection
      const samplingResponse = await server.request(
        {
          method: 'sampling/createMessage',
          params: {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: prompt,
                },
              },
            ],
            maxTokens: max_tokens,
            temperature: temperature,
            metadata: {
              source: 'mirror-mcp-reflection',
            },
          },
        },
        CreateMessageRequestSchema
      );

      // Extract the reflection from the response
      const reflection = this.extractReflectionFromResponse(samplingResponse);
      const tokensUsed = this.estimateTokensUsed(reflection);

      return {
        reflection,
        tokensUsed,
      };
    } catch (error) {
      // Fallback to a structured self-reflection if sampling fails
      console.error('MCP sampling failed, using fallback reflection:', error);
      return this.generateFallbackReflection(question, context);
    }
  }

  private buildReflectionPrompt(question: string, context?: string): string {
    let prompt = `You are being asked to reflect on your own reasoning and analysis. `;
    
    if (context) {
      prompt += `Given the following context:\n\n${context}\n\n`;
    }
    
    prompt += `Please engage in thoughtful self-reflection to answer this question: ${question}\n\n`;
    prompt += `In your reflection, consider:\n`;
    prompt += `- The strengths and weaknesses of your reasoning\n`;
    prompt += `- Potential blind spots or assumptions you might have made\n`;
    prompt += `- Areas where you feel confident vs uncertain\n`;
    prompt += `- Alternative perspectives or approaches you could consider\n\n`;
    prompt += `Provide a thoughtful, honest reflection:`;

    return prompt;
  }

  private extractReflectionFromResponse(response: any): string {
    // Handle different possible response formats from MCP sampling
    if (response.content && Array.isArray(response.content)) {
      const textContent = response.content.find((item: any) => item.type === 'text');
      if (textContent) {
        return textContent.text;
      }
    }
    
    if (response.content && typeof response.content === 'string') {
      return response.content;
    }
    
    if (response.message && response.message.content) {
      return response.message.content;
    }
    
    if (typeof response === 'string') {
      return response;
    }
    
    throw new Error('Unable to extract reflection from sampling response');
  }

  private estimateTokensUsed(text: string): number {
    // Simple token estimation (roughly 4 characters per token for English)
    return Math.ceil(text.length / 4);
  }

  private generateFallbackReflection(question: string, context?: string): ReflectionResult {
    let reflection = `Reflecting on the question: "${question}"\n\n`;
    
    if (context) {
      reflection += `Given the provided context, `;
    }
    
    reflection += `I should approach this through systematic self-examination. `;
    reflection += `This question prompts me to consider my reasoning processes, `;
    reflection += `potential biases, and the confidence levels in my analysis. `;
    reflection += `I should evaluate both what I know and what I'm uncertain about, `;
    reflection += `while considering alternative perspectives that might challenge my initial thinking.`;

    return {
      reflection,
      tokensUsed: this.estimateTokensUsed(reflection),
    };
  }
}