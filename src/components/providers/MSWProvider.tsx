"use client";

import { useState, useEffect, type ReactNode } from "react";

/**
 * MSWProvider — starts the MSW service worker in development mode.
 * Children are rendered only after the worker is ready so that no
 * fetch calls slip through before interception is active.
 */
export default function MSWProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (process.env.NODE_ENV !== "development") {
            setReady(true);
            return;
        }

        async function startWorker() {
            const { worker } = await import("@/mocks/browser");
            await worker.start({
                onUnhandledRequest: "bypass",
            });
            setReady(true);
        }

        startWorker();
    }, []);

    if (!ready) return null;

    return <>{children}</>;
}
