const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any,
  options: RequestInit = {}
): Promise<T> {
  let url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  // Add body for non-GET requests
  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  // Add query params for GET requests
  if (data && method === 'GET') {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    const queryString = params.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  try {
    const response = await fetch(url, config);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }
      return response.text() as T;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new ApiError(
        result.error || result.message || `HTTP ${response.status}`,
        response.status,
        result
      );
    }

    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'Network error: Unable to connect to server',
        0
      );
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0
    );
  }
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, params?: any) =>
    apiRequest<T>('GET', endpoint, params),

  post: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>('POST', endpoint, data),

  put: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>('PUT', endpoint, data),

  patch: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>('PATCH', endpoint, data),

  delete: <T = any>(endpoint: string) =>
    apiRequest<T>('DELETE', endpoint),
};

export default api;
