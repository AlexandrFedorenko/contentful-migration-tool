import { useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { KeyRound, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/context/SessionContext";

const ERRORS: Record<string, string> = {
    oauth_not_configured: "Sign-in with Contentful is not configured on this server.",
    oauth_failed: "Contentful sign-in was cancelled or failed. Please try again.",
};

function safeReturnTo(value: unknown): string {
    return typeof value === "string" && /^\/(?!\/)/.test(value) ? value : "/";
}

export default function SignInPage() {
    const router = useRouter();
    const { methods, isLoaded, refresh } = useSession();
    const [token, setToken] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const returnTo = safeReturnTo(router.query.returnTo);
    const queryError = typeof router.query.error === "string" ? ERRORS[router.query.error] : null;

    const onTokenLogin = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/token-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: token.trim() }),
            });
            const body = await res.json();
            if (!res.ok || !body.success) throw new Error(body.error || "Sign-in failed");
            setToken("");
            await refresh();
            await router.replace(returnTo);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign-in failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head><title>Sign in · Contentful Migration Tool</title></Head>
            <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Sign in</CardTitle>
                        <CardDescription>Use your Contentful account. No separate registration needed.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {(error || queryError) && (
                            <Alert variant="destructive"><AlertDescription>{error || queryError}</AlertDescription></Alert>
                        )}

                        {!isLoaded ? (
                            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : (
                            <>
                                {methods.oauth && (
                                    <Button asChild size="lg" className="w-full">
                                        <a href={`/api/auth/contentful/start?returnTo=${encodeURIComponent(returnTo)}`}>
                                            <LogIn /> Continue with Contentful
                                        </a>
                                    </Button>
                                )}

                                {methods.oauth && methods.token && (
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <Separator className="flex-1" /> or <Separator className="flex-1" />
                                    </div>
                                )}

                                {methods.token && (
                                    <form onSubmit={onTokenLogin} className="space-y-3">
                                        <Label htmlFor="token">Personal access token</Label>
                                        <Input
                                            id="token"
                                            type="password"
                                            autoComplete="off"
                                            placeholder="CFPAT-..."
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Create one in Contentful: Settings → CMA tokens → Create personal access token.
                                        </p>
                                        <Button type="submit" variant="outline" className="w-full" disabled={submitting || token.trim().length < 20}>
                                            {submitting ? <Loader2 className="animate-spin" /> : <KeyRound />} Sign in with token
                                        </Button>
                                    </form>
                                )}

                                {!methods.oauth && !methods.token && (
                                    <Alert><AlertDescription>No sign-in method is enabled on this server.</AlertDescription></Alert>
                                )}
                            </>
                        )}

                        <p className="flex items-start gap-2 text-xs text-muted-foreground">
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                            Your Contentful token is stored encrypted on the server and is never sent back to the browser.
                            You can disconnect it at any time in your profile.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
