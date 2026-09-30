/**
 * @jest-environment node
 */
import path from 'path';
import { environmentId, resolveInside, safeFileName, spaceId } from '@/server/validation';

describe('resolveInside', () => {
    const base = path.resolve('/data');

    it('joins safe segments', () => {
        expect(resolveInside(base, 'backups', 'u1', 'b.json.gz')).toBe(path.join(base, 'backups', 'u1', 'b.json.gz'));
    });

    it.each([['..', 'etc', 'passwd'], ['../../etc/passwd'], ['/etc/passwd'], ['a/../../b'], ['a\0b']])('rejects %j', (...segments) => {
        expect(() => resolveInside(base, ...(segments as string[]))).toThrow();
    });
});

describe('identifier schemas', () => {
    it('accepts Contentful ids and rejects path-like values', () => {
        expect(spaceId.safeParse('abc123XYZ').success).toBe(true);
        expect(spaceId.safeParse('../x').success).toBe(false);
        expect(environmentId.safeParse('master').success).toBe(true);
        expect(environmentId.safeParse('release-2024.01_a').success).toBe(true);
        expect(environmentId.safeParse('a/b').success).toBe(false);
        expect(safeFileName.safeParse('backup (1).json').success).toBe(true);
        expect(safeFileName.safeParse('../x.json').success).toBe(false);
    });
});
