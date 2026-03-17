import { ApiError } from './api';

export function handleError(error: unknown): string {
  if (error instanceof ApiError) {
    return `API Error${error.status ? ` (${error.status})` : ''}: ${error.message}`;
  }

  return error instanceof Error ? error.message : 'An unknown error occurred';
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}