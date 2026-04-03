import type { Metadata, Viewport } from "next";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "새벽시장 - Dawn Market",
  description:
    "한국 초보 투자자를 위한 해외 시장 브리핑 & AI 인사이트",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "새벽시장",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="antialiased">
        <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
          <Header />
          <main className="flex-1 px-4 py-4 pb-20">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
