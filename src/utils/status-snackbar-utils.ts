export type Severity = 'success' | 'info' | 'warning' | 'error';

export const getSeverity = (message: string | null | undefined): Severity => {
    if (!message) {
        return 'info';
    }
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('error') || lowerMessage.includes('failed')) {
        return 'error';
    }
    
    if (lowerMessage.includes('success') || lowerMessage.includes('completed')) {
        return 'success';
    }
    
    if (lowerMessage.includes('warning') || lowerMessage.includes('warn')) {
        return 'warning';
    }
    
    return 'info';
};

