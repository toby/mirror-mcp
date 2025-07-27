import { ReflectionEngine } from '../reflection-engine';

// Mock Server class
class MockServer {
  async request() {
    throw new Error('Sampling request failed');
  }
}

describe('ReflectionEngine', () => {
  let reflectionEngine: ReflectionEngine;
  let mockServer: MockServer;

  beforeEach(() => {
    reflectionEngine = new ReflectionEngine();
    mockServer = new MockServer();
  });

  test('should handle basic reflection with fallback', async () => {
    const request = {
      question: 'What are my limitations?',
    };

    const result = await reflectionEngine.reflect(request, mockServer as any);

    expect(result).toBeDefined();
    expect(result.reflection).toContain('question');
    expect(result.reflection).toContain('limitations');
    expect(result.tokensUsed).toBeGreaterThan(0);
    expect(typeof result.reflection).toBe('string');
    expect(typeof result.tokensUsed).toBe('number');
  });

  test('should handle reflection with context', async () => {
    const request = {
      question: 'How confident am I in this analysis?',
      context: 'Previous analysis showed 25% improvement',
    };

    const result = await reflectionEngine.reflect(request, mockServer as any);

    expect(result).toBeDefined();
    expect(result.reflection).toContain('question');
    expect(result.tokensUsed).toBeGreaterThan(0);
  });

  test('should validate required question parameter', async () => {
    const request = {
      context: 'Some context without question',
    };

    await expect(reflectionEngine.reflect(request as any, mockServer as any))
      .rejects.toThrow('Question is required');
  });

  test('should validate max_tokens parameter', async () => {
    const request = {
      question: 'Test question',
      max_tokens: 5000, // Too high
    };

    await expect(reflectionEngine.reflect(request, mockServer as any))
      .rejects.toThrow('max_tokens must be between 1 and 4000');
  });

  test('should validate temperature parameter', async () => {
    const request = {
      question: 'Test question',
      temperature: 3.0, // Too high
    };

    await expect(reflectionEngine.reflect(request, mockServer as any))
      .rejects.toThrow('temperature must be between 0 and 2');
  });

  test('should handle custom parameters', async () => {
    const request = {
      question: 'Test question',
      context: 'Test context',
      max_tokens: 200,
      temperature: 0.5,
    };

    const result = await reflectionEngine.reflect(request, mockServer as any);

    expect(result).toBeDefined();
    expect(result.reflection).toContain('question');
    expect(result.tokensUsed).toBeGreaterThan(0);
  });

  test('should handle system prompt', async () => {
    const request = {
      question: 'What are my strengths?',
      system_prompt: 'You are an expert coach helping with self-assessment.',
    };

    const result = await reflectionEngine.reflect(request, mockServer as any);

    expect(result).toBeDefined();
    expect(result.reflection).toContain('strengths');
    expect(result.reflection).toContain('guidance');
    expect(result.tokensUsed).toBeGreaterThan(0);
  });

  test('should handle user prompt', async () => {
    const request = {
      question: 'How can I improve?',
      user_prompt: 'Focus on technical skills and provide specific actionable advice.',
    };

    const result = await reflectionEngine.reflect(request, mockServer as any);

    expect(result).toBeDefined();
    expect(result.reflection).toContain('improve');
    expect(result.reflection).toContain('instructions');
    expect(result.tokensUsed).toBeGreaterThan(0);
  });

  test('should handle both system and user prompts', async () => {
    const request = {
      question: 'What is my confidence level?',
      system_prompt: 'You are a professional mentor providing guidance.',
      user_prompt: 'Analyze confidence levels and provide detailed feedback.',
      context: 'Recent project completion with positive feedback',
    };

    const result = await reflectionEngine.reflect(request, mockServer as any);

    expect(result).toBeDefined();
    expect(result.reflection).toContain('confidence');
    expect(result.reflection).toContain('guidance');
    expect(result.reflection).toContain('instructions');
    expect(result.tokensUsed).toBeGreaterThan(0);
  });
});