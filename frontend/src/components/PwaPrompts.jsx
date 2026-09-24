import React, { useEffect, useState } from "react";
import { Download, X, WifiOff, RefreshCw, Share, Plus } from "lucide-react";
import { applyUpdate, SW_EVENTS } from "../pwa/registerSW.js";

const DISMISS_KEY = "study-anchor-install-dismissed";
const DISMISS_DAYS = 14;

function dismissedRecently() {
  const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
  return at > 0 && Date.now() - at < DISMISS_DAYS * 864e5;
}

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);

/** Slim banner across the top of the app whenever the device drops offline. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-night px-4 py-2 text-center text-xs font-medium text-white"
    >
      <WifiOff className="h-3.5 w-3.5 text-accent" />
      Offline — showing the materials you've already opened.
    </div>
  );
}

/** Toast shown when a newer build has been downloaded in the background. */
export function UpdateToast() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const show = () => setReady(true);
    window.addEventListener(SW_EVENTS.UPDATE_READY, show);
    return () => window.removeEventListener(SW_EVENTS.UPDATE_READY, show);
  }, []);

  if (!ready) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-[90] animate-slide-up sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-80 lg:bottom-6">
      <div className="lv-card flex items-center gap-3 p-3.5">
        <span className="rounded-xl bg-accent/15 p-2">
          <RefreshCw className="h-4 w-4 text-accent-fg dark:text-accent" />
        </span>
        <p className="flex-1 text-sm leading-snug">A new version of Study Anchor is ready.</p>
        <button
          onClick={applyUpdate}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg hover:bg-highlight-deep"
        >
          Reload
        </button>
      </div>
    </div>
  );
}

/**
 * Invitation to install. Chrome/Edge/Android get the real prompt via
 * `beforeinstallprompt`; iOS Safari never fires that event, so it gets the
 * Share → Add to Home Screen instructions instead.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || dismissedRecently()) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", () => {
      setDeferred(null);
      setShowIosHint(false);
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    });

    // Give iOS users the hint only after they've stuck around a little.
    let timer;
    if (isIos()) timer = setTimeout(() => setShowIosHint(true), 8000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDeferred(null);
    setShowIosHint(false);
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome !== "accepted") localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDeferred(null);
  }

  if (!deferred && !showIosHint) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-[80] animate-slide-up sm:inset-x-auto sm:right-6 sm:w-[22rem] lg:bottom-6">
      <div className="lv-card overflow-hidden">
        <div className="h-1 w-full bg-accent" />
        <div className="flex items-start gap-3 p-4">
          <img src="/icons/icon-64.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold leading-tight">Keep Study Anchor on your home screen</p>
            {deferred ? (
              <p className="mt-1 text-sm lv-meta">
                Opens full screen and keeps your materials readable when the network drops.
              </p>
            ) : (
              <p className="mt-1 flex flex-wrap items-center gap-1 text-sm lv-meta">
                Tap
                <Share className="mx-0.5 inline h-4 w-4 text-accent" aria-label="Share" />
                then
                <span className="inline-flex items-center gap-1 font-medium text-night dark:text-slate-200">
                  <Plus className="h-3.5 w-3.5" /> Add to Home Screen
                </span>
              </p>
            )}
            {deferred && (
              <button
                onClick={install}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg shadow-glow hover:bg-highlight-deep"
              >
                <Download className="h-4 w-4" /> Install app
              </button>
            )}
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="rounded-full p-1.5 lv-meta hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** One mount point for every PWA-related surface. */
export default function PwaPrompts() {
  return (
    <>
      <UpdateToast />
      <InstallPrompt />
    </>
  );
}
