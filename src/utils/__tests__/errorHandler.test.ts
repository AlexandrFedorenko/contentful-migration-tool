import { handleError, isApiError } from '../errorHandler';
import { ApiError } from '../api';

describe('errorHandler', () => {
    it('handles ApiError with status', () => {
        const error = new ApiError('Not Found', 404);
        expect(handleError(error)).toBe('API Error (404): Not Found');
    });

    it('handles ApiError without status', () => {
        const error = new ApiError('Bad Request');
        expect(handleError(error)).toBe('API Error: Bad Request');
    });

    it('handles regular Error', () => {
        const error = new Error('Generic Error');
        expect(handleError(error)).toBe('Generic Error');
    });

    it('handles unknown error types', () => {
        expect(handleError('string error')).toBe('An unknown error occurred');
        expect(handleError({ msg: 'object error' })).toBe('An unknown error occurred');
    });

    it('correctly identifies ApiError', () => {
        const apiError = new ApiError('test');
        const regularError = new Error('test');

        expect(isApiError(apiError)).toBe(true);
        expect(isApiError(regularError)).toBe(false);
    });
});
