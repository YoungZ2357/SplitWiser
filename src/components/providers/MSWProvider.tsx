"use client";

import { useState, useEffect, type ReactNode } from "react";

/**
 * MSWProvider — starts the MSW service worker in development mode.
 * Children are rendered only after the worker is ready so that no
 * fetch calls slip through before interception is active.
 * 
 * MSW is now disabled by default. Set NEXT_PUBLIC_ENABLE_MSW=true to enable.
 */
export default function MSWProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Check if MSW is explicitly enabled via environment variable
        const enableMSW = process.env.NEXT_PUBLIC_ENABLE_MSW === "true";
        
        // Skip MSW in production or if not explicitly enabled
        if (process.env.NODE_ENV !== "development" || !enableMSW) {
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
