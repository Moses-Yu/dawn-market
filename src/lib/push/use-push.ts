"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isPushSupported,
  getPermissionState,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from "./client";

export type PushState =
  | "loading"
  | "unsupported"
  | "prompt"      // Permission not yet asked
  | "subscribed"  // Active subscription
  | "denied"      // User denied permission
  | "unsubscribed"; // Permission granted but not subscribed

export function usePush() {
  const [state, setState] = useState<PushState>("loading");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function check() {
      if (!isPushSupported()) {
        setState("unsupported");
        return;
      }

      const permission = getPermissionState();
      if (permission === "denied") {
        setState("denied");
        return;
      }

      if (permission === "default") {
        setState("prompt");
        return;
      }

      // Permission is granted — check subscription
      const sub = await getCurrentSubscription();
      setState(sub ? "subscribed" : "unsubscribed");
    }

    check();
  }, []);

  const subscribe = useCallback(async () => {
    setIsProcessing(true);
    try {
      const sub = await subscribeToPush();
      setState(sub ? "subscribed" : getPermissionState() === "denied" ? "denied" : "prompt");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setIsProcessing(true);
    try {
      await unsubscribeFromPush();
      setState("unsubscribed");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { state, isProcessing, subscribe, unsubscribe };
}
