/* eslint-disable @typescript-eslint/no-explicit-any */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

export class ApiError extends Error {
  constructor(message: string, public status?: number, public details?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Shared request helper to handle fetch logic and error parsing
 */
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options);

    // We expect JSON responses for all our API endpoints
    const data = await response.json().catch(() => ({
      error: `Unexpected response format (HTTP ${response.status})`
    }));

    if (!response.ok) {
      // Special handling for 409 Conflict (Backup limit reached)
      // We want to pass the data back to the caller to handle specific UI logic (Overwrite Dialog)
      // The server returns { success: false, data: { limitReached: true } }
      if (response.status === 409 && data && typeof data === 'object' && 'data' in data && (data as any).data?.limitReached) {
        return data as ApiResponse<T>;
      }

      const errorMessage = (data as any)?.error || (typeof data === 'string' ? data : 'Request failed');
      const details = (data as any)?.details;
      throw new ApiError(errorMessage, response.status, details);
    }

    // Check if the response is already in the standardized format
    if (data && typeof data === 'object' && 'success' in data) {
      return data as ApiResponse<T>;
    }

    return { success: true, data };
  } catch (error) {
    if (error instanceof ApiError) throw error;

    // Handle network errors or JSON parse errors
    const message = error instanceof Error ? error.message : 'Unknown network error';
    throw new ApiError(message);
  }
}

export const api = {
  async get<T = unknown>(url: string): Promise<ApiResponse<T>> {
    return request<T>(url, { method: 'GET' });
  },

  async post<T = unknown>(url: string, body: unknown): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;

    return request<T>(url, {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? (body as BodyInit) : JSON.stringify(body),
    });
  },

  async put<T = unknown>(url: string, body: unknown): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;

    return request<T>(url, {
      method: 'PUT',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? (body as BodyInit) : JSON.stringify(body),
    });
  },

  async delete<T = unknown>(url: string): Promise<ApiResponse<T>> {
    return request<T>(url, { method: 'DELETE' });
  }
};