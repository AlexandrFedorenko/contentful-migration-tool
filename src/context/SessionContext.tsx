import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface SessionUser {
    id: string;
    email: string;
    role: 'ADMIN' | 'MEMBER';
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    hasContentfulToken: boolean;
}

export interface SignInMethods {
    oauth: boolean;
    token: boolean;
}

interface MeResponse {
    user: SessionUser | null;
    methods: SignInMethods;
}

interface SessionContextValue {
    user: SessionUser | null;
    methods: SignInMethods;
    isLoaded: boolean;
    isSignedIn: boolean;
    refresh: () => Promise<void>;
    signOut: (opts?: { redirectUrl?: string }) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);
export const SESSION_QUERY_KEY = ['auth', 'me'] as const;

async function fetchMe(): Promise<MeResponse> {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`Failed to load session (${res.status})`);
    const body = (await res.json()) as { data: MeResponse };
    return body.data;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: SESSION_QUERY_KEY,
        queryFn: fetchMe,
        staleTime: 60_000,
        retry: 1,
    });

    const refresh = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    }, [queryClient]);

    const signOut = useCallback(async (opts?: { redirectUrl?: string }) => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
        queryClient.clear();
        window.location.href = opts?.redirectUrl ?? '/sign-in';
    }, [queryClient]);

    const value = useMemo<SessionContextValue>(() => ({
        user: data?.user ?? null,
        methods: data?.methods ?? { oauth: false, token: false },
        isLoaded: !isLoading,
        isSignedIn: Boolean(data?.user),
        refresh,
        signOut,
    }), [data, isLoading, refresh, signOut]);

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error('useSession must be used within SessionProvider');
    return ctx;
}

/** Shape-compatible replacement for the Clerk `useUser()` hook used across the app. */
export function useUser() {
    const { user, isLoaded, isSignedIn } = useSession();
    return {
        isLoaded,
        isSignedIn,
        user: user && {
            ...user,
            fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
            imageUrl: user.avatarUrl ?? undefined,
            primaryEmailAddress: { emailAddress: user.email },
        },
    };
}
