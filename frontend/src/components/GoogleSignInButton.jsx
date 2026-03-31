import { useEffect, useRef, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../hooks/useAuth";

const googleScriptSrc = "https://accounts.google.com/gsi/client";

function GoogleSignInButton({ onSuccess, onError }) {
  const buttonRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const { saveSessionFromResponse } = useAuth();
  const [scriptReady, setScriptReady] = useState(
    typeof window !== "undefined" && Boolean(window.google?.accounts?.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onError, onSuccess]);

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return undefined;
    }

    const existingScript = document.querySelector(`script[src="${googleScriptSrc}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => setScriptReady(true), { once: true });
      return undefined;
    }

    const script = document.createElement("script");
    script.src = googleScriptSrc;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    document.body.appendChild(script);

    return undefined;
  }, []);

  useEffect(() => {
    if (
      !scriptReady ||
      !buttonRef.current ||
      !window.google?.accounts?.id ||
      !import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      hasInitializedRef.current
    ) {
      return undefined;
    }

    hasInitializedRef.current = true;
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        if (isSubmittingRef.current) {
          return;
        }

        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
          const apiResponse = await apiClient.post("/auth/google", {
            credential: response.credential
          });
          saveSessionFromResponse(apiResponse.data.data);
          onSuccessRef.current?.(apiResponse.data.data.user);
        } catch (error) {
          onErrorRef.current?.(error.response?.data?.message || "Google sign-in failed");
        } finally {
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        }
      },
      auto_select: false,
      use_fedcm_for_button: false,
      button_auto_select: false
    });

    buttonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      width: 320,
      text: "continue_with"
    });

    return undefined;
  }, [saveSessionFromResponse, scriptReady]);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="relative inline-flex max-w-full">
        <div
          ref={buttonRef}
          aria-hidden={isSubmitting}
          className={`flex justify-center sm:justify-start ${isSubmitting ? "pointer-events-none opacity-70" : ""}`}
        />
        {isSubmitting ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70 text-xs font-semibold text-slate-700 backdrop-blur-[1px]">
            Signing in with Google...
          </div>
        ) : null}
      </div>
      <p className="text-xs text-slate-500">Continue securely with your Google account.</p>
    </div>
  );
}

export default GoogleSignInButton;
