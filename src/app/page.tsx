"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }

      setChecking(false);
    }

    checkAuth();
  }, [router]);

  if (!checking) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#FAF7F2",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid #e5e0d8",
          borderTop: "3px solid #C05621",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
