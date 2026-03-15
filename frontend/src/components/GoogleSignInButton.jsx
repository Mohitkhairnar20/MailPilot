import { useEffect, useRef, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../hooks/useAuth";

const googleScriptSrc = "https://accounts.google.com/gsi/client";

function GoogleSignInButton({ onSuccess, onError }) {
  const buttonRef = useRef(null);
  const { saveSessionFromResponse } = useAuth();
  const [scriptReady, setScriptReady] = useState(
    typeof window !== "undefined" && Boolean(window.google?.accounts?.id)
  );

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
    if (!scriptReady || !buttonRef.current || !window.google?.accounts?.id || !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      return undefined;
    }

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const apiResponse = await apiClient.post("/auth/google", {
            credential: response.credential
          });
          saveSessionFromResponse(apiResponse.data.data);
          onSuccess?.(apiResponse.data.data.user);
        } catch (error) {
          onError?.(error.response?.data?.message || "Google sign-in failed");
        }
      }
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
  }, [onError, onSuccess, saveSessionFromResponse, scriptReady]);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div ref={buttonRef} className="flex justify-center sm:justify-start" />
      <p className="text-xs text-slate-500">Continue securely with your Google account.</p>
    </div>
  );
}

export default GoogleSignInButton;
