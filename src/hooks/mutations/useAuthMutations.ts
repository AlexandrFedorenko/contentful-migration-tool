import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { api } from '@/utils/api';

interface AuthResponse {
    success: boolean;
    token?: string;
    message?: string;
    user?: unknown;
    browser_url?: string;
}

export function useAuthMutations() {
    const queryClient = useQueryClient();
    const router = useRouter();

    const startLoginMutation = useMutation({
        mutationFn: async () => {
            const result = await api.post<AuthResponse>('/api/contentful-auth-browser', {
                action: 'start-login'
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to start login process');
            }

            if (result.data?.browser_url) {
                return result.data.browser_url;
            } else {
                throw new Error(result.data?.message || 'Failed to start login process');
            }
        },
    });

    const saveTokenMutation = useMutation({
        mutationFn: async (token: string) => {
            const result = await api.post<AuthResponse>('/api/auth/save-token', { token });

            if (!result.success) {
                throw new Error(result.error || result.data?.message || 'Failed to save token');
            }

            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auth-status'] });
            router.push('/');
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            const result = await api.post<void>('/api/auth/logout', {});

            if (!result.success) {
                throw new Error(result.error || 'Failed to logout');
            }
        },
        onSuccess: () => {
            queryClient.clear();
            router.push('/login');
        },
    });

    return {
        saveToken: saveTokenMutation,
        logout: logoutMutation,
        startLogin: startLoginMutation,
    };
}
