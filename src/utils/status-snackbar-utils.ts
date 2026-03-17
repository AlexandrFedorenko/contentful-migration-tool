export type Severity = 'success' | 'info' | 'warning' | 'error';

export const getSeverity = (message: unknown): Severity => {
    if (!message || typeof message !== 'string') return 'success';

    const lower = message.toLowerCase();

    if (lower.includes('error') || lower.includes('failed')) return 'error';
    if (lower.includes('success') || lower.includes('completed')) return 'success';
    if (lower.includes('warning') || lower.includes('warn')) return 'warning';

    return 'info';
};

