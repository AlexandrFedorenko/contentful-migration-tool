/** An error that is safe to show to the client: status, stable code and message. */
export class HttpError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string,
        message: string,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'HttpError';
    }
}

export const badRequest = (message: string, details?: unknown) => new HttpError(400, 'BAD_REQUEST', message, details);
export const unauthorized = () => new HttpError(401, 'UNAUTHORIZED', 'Sign in required');
export const forbidden = () => new HttpError(403, 'FORBIDDEN', 'You do not have access to this resource');
export const notFound = (what = 'Resource') => new HttpError(404, 'NOT_FOUND', `${what} not found`);
