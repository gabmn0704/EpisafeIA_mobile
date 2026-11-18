import { resolveApiUrl } from './config';

describe('resolveApiUrl', () => {
  it('prefers the explicit env var and trims trailing slashes', () => {
    expect(resolveApiUrl('http://10.0.0.5:4000/api/v1/', '192.168.1.9:8081')).toBe('http://10.0.0.5:4000/api/v1');
  });

  it('derives the LAN host from the Expo dev server', () => {
    expect(resolveApiUrl(undefined, '192.168.1.9:8081')).toBe('http://192.168.1.9:4000/api/v1');
  });

  it('falls back to localhost when nothing else is known', () => {
    expect(resolveApiUrl('  ', undefined)).toBe('http://localhost:4000/api/v1');
    expect(resolveApiUrl(undefined, 'localhost:8081')).toBe('http://localhost:4000/api/v1');
  });
});
