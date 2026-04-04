"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

export default function AnalyticsProvider() {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname && pathname !== prevPath.current) {
      prevPath.current = pathname;
      trackPageView(pathname);
    }
  }, [pathname]);

  return null;
}
