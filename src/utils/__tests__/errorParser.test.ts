import { parseError, instructionToString } from '../errorParser';

describe('errorParser', () => {
    it('parses content type conflict error', () => {
        const msg = "Content type 'page' already exists";
        const result = parseError(msg);
        expect(result?.title).toBe('Content Type Conflict');
        expect(result?.severity).toBe('error');
    });

    it('parses duplicate error', () => {
        const msg = "Entity 'test' already exists";
        const result = parseError(msg);
        expect(result?.title).toBe('Duplicate Content Detected');
        expect(result?.severity).toBe('warning');
    });

    it('parses field deletion error', () => {
        const msg = "You need to omit a field before deleting it. ContentType MyPage (id)";
        const result = parseError(msg);
        expect(result?.title).toBe('Field Cannot Be Deleted');
        expect(result?.severity).toBe('error');
    });

    it('parses rate limit error', () => {
        const msg = "Rate limit exceeded";
        const result = parseError(msg);
        expect(result?.title).toBe('Rate Limit Exceeded');
        expect(result?.severity).toBe('info');
    });

    it('parses validation error', () => {
        const msg = "Required parameter spaceId is missing";
        const result = parseError(msg);
        expect(result?.title).toBe('Missing Required Parameters');
    });

    it('returns generic error for unknown message', () => {
        const msg = "Something went wrong";
        const result = parseError(msg);
        expect(result?.title).toBe('Restore Error');
    });

    it('parses "cannot be deleted because it has entries"', () => {
        const msg = 'Content type "blogPost" cannot be deleted because it has entries';
        const result = parseError(msg);
        expect(result.title).toBe('Content Type In Use');
        expect(result.description).toContain('"blogPost"');
    });

    it('parses type mismatch error', () => {
        const msg = 'Validation error: The type of value is incorrect. Details: "type":"Symbol", "value":123';
        const result = parseError(msg);
        expect(result.title).toBe('Type Mismatch Detected');
    });

    it('formats instruction to string correctly', () => {
        const instruction = {
            title: 'Test Error',
            description: 'Something failed',
            steps: ['Step 1', 'Step 2'],
            severity: 'error' as const
        };
        const str = instructionToString(instruction);
        expect(str).toContain('❌ Test Error');
        expect(str).toContain('Something failed');
        expect(str).toContain('💡 Solution:');
        expect(str).toContain('- Step 1');
    });
});
