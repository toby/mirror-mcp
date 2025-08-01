import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CreateMessageRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export interface ReflectionRequest {
  question: string;
  context?: string;
  system_prompt?: string;
  user_prompt?: string;
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
      system_prompt,
      user_prompt,
      max_tokens = 1500,
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

    try {
      // Build messages for MCP sampling
      const messages = this.buildReflectionMessages(question, context, system_prompt, user_prompt);

      // Use MCP sampling to generate the reflection
      const samplingResponse = await server.request(
        {
          method: 'sampling/createMessage',
          params: {
            messages,
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
      // Check if the error is related to token limits being reached
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('length limit was reached') || errorMessage.includes('token limit')) {
        console.error('Token limit reached during sampling, using fallback reflection with increased max_tokens recommendation');
        const fallbackResult = this.generateFallbackReflection(question, context, system_prompt, user_prompt);
        fallbackResult.reflection += '\n\n[Note: The original reflection was truncated due to token limits. Consider increasing max_tokens for longer responses.]';
        return fallbackResult;
      }
      
      // Fallback to a structured self-reflection if sampling fails for other reasons
      console.error('MCP sampling failed, using fallback reflection:', error);
      return this.generateFallbackReflection(question, context, system_prompt, user_prompt);
    }
  }

  private buildReflectionMessages(question: string, context?: string, system_prompt?: string, user_prompt?: string): any[] {
    const messages: any[] = [];

    // Build user message - incorporate system_prompt into user message since MCP sampling only accepts 'user' and 'assistant' roles
    let userMessage: string;
    if (user_prompt) {
      userMessage = user_prompt;
      // Prepend system prompt if provided
      if (system_prompt) {
        userMessage = `${system_prompt}\n\n${userMessage}`;
      }
    } else {
      userMessage = this.buildReflectionPrompt(question, context, system_prompt);
    }

    messages.push({
      role: 'user',
      content: {
        type: 'text',
        text: userMessage,
      },
    });

    return messages;
  }

  private buildReflectionPrompt(question: string, context?: string, system_prompt?: string): string {
    let prompt = '';
    
    // Add system prompt at the beginning if provided
    if (system_prompt) {
      prompt += `${system_prompt}\n\n`;
    }
    
    prompt += `You are being asked to reflect on your own reasoning and analysis. `;
    
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
      if (textContent && textContent.text) {
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
    
    // Handle cases where response might be truncated or incomplete
    if (response && typeof response === 'object') {
      // Try to extract any text content from the response object
      const possibleFields = ['text', 'content', 'response', 'output', 'result'];
      for (const field of possibleFields) {
        if (response[field] && typeof response[field] === 'string') {
          return response[field];
        }
      }
    }
    
    throw new Error('Unable to extract reflection from sampling response');
  }

  private estimateTokensUsed(text: string): number {
    // Simple token estimation (roughly 4 characters per token for English)
    return Math.ceil(text.length / 4);
  }

  private generateFallbackReflection(question: string, context?: string, system_prompt?: string, user_prompt?: string): ReflectionResult {
    let reflection = `Reflecting on the question: "${question}"\n\n`;
    
    if (system_prompt) {
      reflection += `With the guidance: ${system_prompt}\n\n`;
    }
    
    if (context) {
      reflection += `Given the provided context, `;
    }
    
    if (user_prompt) {
      reflection += `Following the specific instructions: ${user_prompt}\n\n`;
      reflection += `I should approach this reflection accordingly. `;
    } else {
      reflection += `I should approach this through systematic self-examination. `;
      reflection += `This question prompts me to consider my reasoning processes, `;
      reflection += `potential biases, and the confidence levels in my analysis. `;
      reflection += `I should evaluate both what I know and what I'm uncertain about, `;
      reflection += `while considering alternative perspectives that might challenge my initial thinking.`;
    }

    return {
      reflection,
      tokensUsed: this.estimateTokensUsed(reflection),
    };
  }
}