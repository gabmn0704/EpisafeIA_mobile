import { z } from 'zod';
import { ApiClient, buildQuery } from './client';
import { ApiError } from './errors';
import type { Tokens } from './tokenStore';

const json = (status: number, body: unknown): Response =>
  ({ status, ok: status >= 200 && status < 300, json: async () => body }) as unknown as Response;

function setup(responses: (Response | Error)[], initial: Tokens | null = { accessToken: 'a1', refreshToken: 'r1' }) {
  let tokens = initial;
  const fetchImpl = jest.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error('sin respuesta preparada');
    if (next instanceof Error) throw next;
    return next;
  });
  const client = new ApiClient({
    baseUrl: 'http://api/v1',
    getTokens: () => tokens,
    setTokens: (t) => {
      tokens = t;
    },
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });
  return { client, fetchImpl, getTokens: () => tokens };
}

describe('buildQuery', () => {
  it('skips empty values and encodes the rest', () => {
    expect(buildQuery({ q: 'a b', limit: 5, x: undefined, y: '', z: null })).toBe('?q=a%20b&limit=5');
    expect(buildQuery()).toBe('');
  });
});

describe('ApiClient', () => {
  it('sends the bearer token and validates the response with zod', async () => {
    const { client, fetchImpl } = setup([json(200, { ok: true })]);
    const res = await client.get('/health', { schema: z.object({ ok: z.boolean() }) });
    expect(res).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://api/v1/health');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer a1');
  });

  it('does not send the token to public endpoints', async () => {
    const { client, fetchImpl } = setup([json(200, {})]);
    await client.post('/auth/login', { auth: false, body: { email: 'x' } });
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
    expect(init.body).toBe('{"email":"x"}');
  });

  it('maps the uniform error body to ApiError', async () => {
    const { client } = setup([json(400, { error: { code: 'VALIDATION_ERROR', message: 'Correo invalido', details: [1] } })]);
    await expect(client.get('/x')).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR', message: 'Correo invalido' });
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    const { client, fetchImpl, getTokens } = setup([
      json(401, { error: { code: 'UNAUTHORIZED', message: 'expiro' } }),
      json(200, { accessToken: 'a2', refreshToken: 'r2' }),
      json(200, { value: 1 }),
    ]);
    expect(await client.get('/me')).toEqual({ value: 1 });
    expect(getTokens()).toEqual({ accessToken: 'a2', refreshToken: 'r2' });
    const retryInit = (fetchImpl.mock.calls[2] as unknown as [string, RequestInit])[1];
    expect((retryInit.headers as Record<string, string>).Authorization).toBe('Bearer a2');
  });

  it('clears the session when the refresh is rejected', async () => {
    const { client, getTokens } = setup([
      json(401, { error: { code: 'UNAUTHORIZED', message: 'expiro' } }),
      json(401, { error: { code: 'UNAUTHORIZED', message: 'revocado' } }),
    ]);
    await expect(client.get('/me')).rejects.toBeInstanceOf(ApiError);
    expect(getTokens()).toBeNull();
  });

  it('keeps the session if the refresh fails for network reasons', async () => {
    const { client, getTokens } = setup([json(401, { error: { code: 'UNAUTHORIZED', message: 'x' } }), new Error('offline')]);
    await expect(client.get('/me')).rejects.toMatchObject({ status: 401 });
    expect(getTokens()).not.toBeNull();
  });

  it('shares a single refresh between concurrent 401s', async () => {
    const { client, fetchImpl } = setup([
      json(401, { error: { code: 'UNAUTHORIZED', message: 'x' } }),
      json(401, { error: { code: 'UNAUTHORIZED', message: 'x' } }),
      json(200, { accessToken: 'a2', refreshToken: 'r2' }),
      json(200, { n: 1 }),
      json(200, { n: 2 }),
    ]);
    await Promise.all([client.get('/a'), client.get('/b')]);
    const refreshCalls = fetchImpl.mock.calls.filter((c) => String((c as unknown as [string])[0]).endsWith('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
  });

  it('reports network failures and invalid payloads', async () => {
    const { client } = setup([new Error('boom'), json(200, { wrong: true })]);
    await expect(client.get('/x')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    await expect(client.get('/x', { schema: z.object({ ok: z.boolean() }) })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('returns undefined on 204', async () => {
    const { client } = setup([{ status: 204, ok: true, json: async () => null } as unknown as Response]);
    expect(await client.delete('/contacts/1')).toBeUndefined();
  });
});
