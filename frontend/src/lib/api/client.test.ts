import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, clearToken, getToken, setToken } from './client';

function mockResponse(status: number, body: unknown, hasJson = true): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'Error',
    json: async () => {
      if (!hasJson) throw new Error('no json body');
      return body;
    },
  } as unknown as Response;
}

describe('api error message extraction', () => {
  beforeEach(() => {
    clearToken();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses detail string when present', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(400, { detail: '不正なリクエストです' })));
    await expect(api.get('/whatever/')).rejects.toMatchObject({
      message: '不正なリクエストです',
      status: 400,
    });
  });

  it('uses the first non_field_errors entry when present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockResponse(400, { non_field_errors: ['予約期間が重複しています', '別のエラー'] }))
    );
    await expect(api.get('/whatever/')).rejects.toMatchObject({
      message: '予約期間が重複しています',
      status: 400,
    });
  });

  it('falls back to the first field error array when no detail/non_field_errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(400, { employee_number: ['この項目は必須です'] })));
    await expect(api.get('/whatever/')).rejects.toMatchObject({
      message: 'この項目は必須です',
      status: 400,
    });
  });

  it('falls back to statusText when the body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(500, null, false)));
    await expect(api.get('/whatever/')).rejects.toMatchObject({
      message: 'Error',
      status: 500,
    });
  });

  it('resolves normally when the response is ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(200, { id: 1 })));
    await expect(api.get('/whatever/')).resolves.toEqual({ id: 1 });
  });

  it('sends the Authorization header when a token is stored', async () => {
    setToken('abc123');
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, {}));
    vi.stubGlobal('fetch', fetchMock);
    await api.get('/whatever/');
    const [, requestInit] = fetchMock.mock.calls[0];
    const headers = requestInit.headers as Headers;
    expect(headers.get('Authorization')).toBe('Token abc123');
    expect(getToken()).toBe('abc123');
  });

  it('omits the Authorization header when no token is stored', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200, {}));
    vi.stubGlobal('fetch', fetchMock);
    await api.get('/whatever/');
    const [, requestInit] = fetchMock.mock.calls[0];
    const headers = requestInit.headers as Headers;
    expect(headers.get('Authorization')).toBeNull();
  });
});

describe('ApiError', () => {
  it('carries status and message', () => {
    const error = new ApiError(404, '見つかりません');
    expect(error.status).toBe(404);
    expect(error.message).toBe('見つかりません');
  });
});
