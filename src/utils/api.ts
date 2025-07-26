interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  async get<T = any>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(data.error || 'Request failed', response.status);
      }
      
      return { success: true, data };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error instanceof Error ? error.message : 'Network error');
    }
  },

  async post<T = any>(url: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(data.error || 'Request failed', response.status);
      }
      
      return { success: true, data };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error instanceof Error ? error.message : 'Network error');
    }
  },

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new ApiError(data.error || 'Request failed', response.status);
      }
      
      return { success: true, data };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error instanceof Error ? error.message : 'Network error');
    }
  }
}; 