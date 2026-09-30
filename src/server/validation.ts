import path from 'path';
import { z } from 'zod';

/**
 * Identifier formats accepted by Contentful. Every value that reaches a file path,
 * a CMA URL or generated migration code must pass one of these first.
 */
export const SPACE_ID_RE = /^[a-zA-Z0-9]{1,64}$/;
export const ENV_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}$/;
/** Content type, entry, asset and field ids. */
export const RESOURCE_ID_RE = /^[a-zA-Z0-9_.-]{1,64}$/;
export const FIELD_ID_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;
export const LOCALE_RE = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{1,8})*$/;

export const spaceId = z.string().regex(SPACE_ID_RE, 'Invalid space id');
export const environmentId = z.string().regex(ENV_ID_RE, 'Invalid environment id');
export const resourceId = z.string().regex(RESOURCE_ID_RE, 'Invalid id');
export const fieldId = z.string().regex(FIELD_ID_RE, 'Invalid field id');
export const localeCode = z.string().regex(LOCALE_RE, 'Invalid locale code');
export const uuid = z.string().uuid();

/** A file name without any directory component. */
export const safeFileName = z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9 _.()-]*$/, 'Invalid file name')
    .refine((v) => !v.includes('..'), 'Invalid file name');

export function isValidSpaceId(v: unknown): v is string {
    return typeof v === 'string' && SPACE_ID_RE.test(v);
}

export function isValidEnvironmentId(v: unknown): v is string {
    return typeof v === 'string' && ENV_ID_RE.test(v);
}

/**
 * Join `segments` onto `base` and guarantee the result stays inside `base`.
 * Throws on traversal attempts (`..`, absolute paths, NUL bytes).
 */
export function resolveInside(base: string, ...segments: string[]): string {
    for (const s of segments) {
        if (typeof s !== 'string' || s.includes('\0')) throw new Error('Invalid path segment');
    }
    const root = path.resolve(base);
    const target = path.resolve(root, ...segments);
    if (target !== root && !target.startsWith(root + path.sep)) {
        throw new Error('Path escapes the allowed directory');
    }
    return target;
}
