import { ApiResponse } from '@/types/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, data.error || 'Unknown error occurred');
    }

    return data as T;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiError(503, 'Service unavailable');
    }
    throw error;
  }
} 