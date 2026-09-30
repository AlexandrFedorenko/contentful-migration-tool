import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Loader2 } from "lucide-react";

/**
 * Contentful OAuth redirect target. Contentful returns the access token in the URL
 * fragment (implicit grant), which is never sent to any server by the browser.
 * We read it, immediately remove it from the address bar/history, and hand it to
 * our API over a same-origin POST, which validates `state` and creates a session.
 */
export default function OAuthCallback() {
    const [message, setMessage] = useState("Completing sign-in…");
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        const params = new URLSearchParams(window.location.hash.slice(1));
        window.history.replaceState(null, "", window.location.pathname);

        const accessToken = params.get("access_token");
        const state = params.get("state");
        if (!accessToken || !state) {
            window.location.replace("/sign-in?error=oauth_failed");
            return;
        }

        fetch("/api/auth/contentful/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken, state }),
        })
            .then(async (res) => {
                const body = await res.json().catch(() => ({}));
                if (!res.ok || !body.success) throw new Error(body.error || "Sign-in failed");
                window.location.replace(body.data?.redirectTo || "/");
            })
            .catch((err: Error) => setMessage(err.message));
    }, []);

    return (
        <>
            <Head>
                <title>Signing in…</title>
                <meta name="referrer" content="no-referrer" />
            </Head>
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>{message}</p>
                {message !== "Completing sign-in…" && <Link className="underline" href="/sign-in">Back to sign in</Link>}
            </div>
        </>
    );
}
