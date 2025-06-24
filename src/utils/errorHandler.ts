import { ApiError } from './api';

export function handleError(error: unknown): string {
  if (error instanceof ApiError) {
    return `API Error (${error.status}): ${error.message}`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
} 