import { useEffect, useCallback, useRef } from 'react';

interface AuthSuccessMessage {
    type: 'CONTENTFUL_AUTH_SUCCESS';
    token: string;
}

interface UseAuthMessageHandlerProps {
    onTokenReceived: (token: string) => Promise<void>;
}

const isAuthSuccessMessage = (data: unknown): data is AuthSuccessMessage => {
    return (
        typeof data === 'object' &&
        data !== null &&
        'type' in data &&
        data.type === 'CONTENTFUL_AUTH_SUCCESS' &&
        'token' in data &&
        typeof (data as { token: unknown }).token === 'string'
    );
};

export const useAuthMessageHandler = ({ onTokenReceived }: UseAuthMessageHandlerProps) => {
    const onTokenReceivedRef = useRef(onTokenReceived);
    
    useEffect(() => {
        onTokenReceivedRef.current = onTokenReceived;
    }, [onTokenReceived]);

    const handleMessage = useCallback(async (event: MessageEvent) => {
        if (isAuthSuccessMessage(event.data)) {
            const { token } = event.data;
            if (token) {
                await onTokenReceivedRef.current(token);
            }
        }
    }, []);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [handleMessage]);
};
