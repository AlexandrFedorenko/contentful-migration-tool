/**
 * Async utilities for the Contentful Migration Tool
 */

/**
 * Delay execution for a specified number of milliseconds
 * Used for rate limiting in CMA operations
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate limiting delay for Contentful Management API
 * CMA has a limit of ~7 req/sec
 */
export const RATE_LIMIT_DELAY_MS = 150;
