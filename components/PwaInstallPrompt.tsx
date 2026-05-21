"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if user hasn't dismissed it previously (or maybe they want it always until installed? Let's give them a dismiss button that remembers)
      if (localStorage.getItem("pwa-prompt-dismissed") !== "true") {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    
    // Check if app is already installed
    window.addEventListener("appinstalled", () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-80 bg-white border border-brand-border rounded-xl shadow-2xl p-4 flex flex-col gap-3 z-[9999] animate-in slide-in-from-bottom-10">
      <div className="flex items-start justify-between">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 bg-brand-forest/10 rounded-xl flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-brand-forest" />
          </div>
          <div>
            <h3 className="font-bold text-brand-forest text-sm">Install ZyOps</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
              Add to your home screen for quick offline access.
            </p>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600 p-1 shrink-0 -mt-1 -mr-1">
          <X className="w-4 h-4" />
        </button>
      </div>
      <button 
        onClick={handleInstall}
        className="w-full bg-brand-forest text-white font-semibold py-2 rounded-lg text-sm hover:bg-brand-forest/90 transition-colors"
      >
        Install App
      </button>
    </div>
  );
}
