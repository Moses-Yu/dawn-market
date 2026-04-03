"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, BarChart3, Bell, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/briefing", label: "브리핑", icon: FileText },
  { href: "/sectors", label: "섹터", icon: BarChart3 },
  { href: "/alerts", label: "알림", icon: Bell },
  { href: "/settings", label: "설정", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[var(--color-background)]/90 backdrop-blur-md pb-safe">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                isActive
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <item.icon
                className={`h-5 w-5 ${
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-muted)] group-hover:text-[var(--color-foreground)]"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
