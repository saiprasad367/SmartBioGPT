import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { GOOGLE_CLIENT_ID } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface Props {
  /** where to go after a successful sign-in */
  redirectTo?: string;
  label?: string;
}

/**
 * Renders the official "Sign in with Google" button (Google Identity Services)
 * and exchanges the returned ID token with the auth-service. Renders nothing
 * when VITE_GOOGLE_CLIENT_ID is not configured, so email/password still works.
 */
const GoogleAuthButton = ({ redirectTo = "/dashboard" }: Props) => {
  const navigate = useNavigate();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    const tick = window.setInterval(() => {
      if (cancelled) return;
      if (window.google?.accounts?.id && containerRef.current) {
        window.clearInterval(tick);

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          cancel_on_tap_outside: true,
          callback: async (response) => {
            setBusy(true);
            try {
              await loginWithGoogle(response.credential);
              toast.success("Signed in with Google");
              navigate(redirectTo);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Google sign-in failed");
            } finally {
              setBusy(false);
            }
          },
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "center",
          width: 320,
        });
        setReady(true);
      }
    }, 150);

    const stop = window.setTimeout(() => window.clearInterval(tick), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(tick);
      window.clearTimeout(stop);
    };
  }, [loginWithGoogle, navigate, redirectTo]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="w-full">
      <div className="relative my-6 flex items-center">
        <div className="flex-grow border-t border-border" />
        <span className="mx-4 text-xs uppercase tracking-wide text-muted-foreground">or</span>
        <div className="flex-grow border-t border-border" />
      </div>
      <div className="flex justify-center">
        <div
          ref={containerRef}
          className={busy ? "pointer-events-none opacity-60" : ready ? "" : "min-h-[44px]"}
        />
      </div>
    </div>
  );
};

export default GoogleAuthButton;
