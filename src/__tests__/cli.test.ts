import { server } from '../cli';

describe('CLI Server', () => {
  test('should export server instance', () => {
    expect(server).toBeDefined();
    expect(typeof server).toBe('object');
  });
});