const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
const TOKEN_KEY = 'fs_auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Token ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = await response.json();
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
        message = data.non_field_errors[0];
      } else {
        const firstValue = Object.values(data)[0];
        message = Array.isArray(firstValue) ? String(firstValue[0]) : JSON.stringify(data);
      }
    } catch {
      // response had no JSON body
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, formData: FormData) => request<T>(path, { method: 'POST', body: formData }),
  getBlob: async (path: string): Promise<Blob> => {
    const token = getToken();
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Token ${token}`);
    }
    const response = await fetch(`${API_BASE_URL}${path}`, { headers });
    if (!response.ok) {
      let message = response.statusText;
      try {
        const data = await response.json();
        message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data);
      } catch {
        // response had no JSON body
      }
      throw new ApiError(response.status, message);
    }
    return response.blob();
  },
};
