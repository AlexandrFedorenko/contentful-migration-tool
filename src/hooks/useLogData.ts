import { useMemo } from 'react';
import { LogData } from '@/components/JsonLogDisplay/types';

const JSON_LOG_MARKER = 'JSON_LOG_CONTENT:';

interface UseLogDataReturn {
    logData: LogData | null;
    loading: boolean;
}

const parseLogData = (errorMessage: string): LogData | null => {
    if (!errorMessage.includes(JSON_LOG_MARKER)) {
        return null;
    }

    try {
        const jsonStart = errorMessage.indexOf(JSON_LOG_MARKER) + JSON_LOG_MARKER.length;
        const jsonContent = errorMessage.substring(jsonStart).trim();
        return JSON.parse(jsonContent) as LogData;
    } catch {
        return null;
    }
};

export const useLogData = (open: boolean, errorMessage?: string): UseLogDataReturn => {
    const logData = useMemo(() => {
        if (open && errorMessage) {
            return parseLogData(errorMessage);
        }
        return null;
    }, [open, errorMessage]);

    return { logData, loading: false };
};