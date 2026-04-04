import type { Metadata, Viewport } from "next";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import ClientErrorReporter from "@/components/ClientErrorReporter";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "새벽시장 - Dawn Market",
    template: "%s | 새벽시장",
  },
  description:
    "한국 초보 투자자를 위한 해외 시장 브리핑 & AI 인사이트. 매일 새벽, 밤사이 해외 시장 뉴스를 한눈에.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "새벽시장",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "새벽시장 Dawn Market",
    title: "새벽시장 - 초보 투자자를 위한 AI 시장 브리핑",
    description:
      "밤사이 해외 시장에서 무슨 일이? 반도체·방산·AI·2차전지 섹터 뉴스를 AI가 매일 새벽 정리해드립니다.",
  },
  twitter: {
    card: "summary_large_image",
    title: "새벽시장 - Dawn Market",
    description:
      "밤사이 해외 시장에서 무슨 일이? AI가 매일 새벽 정리해드립니다.",
  },
  robots: {
    index: true,
    follow: true,
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
        <ClientErrorReporter />
        <ErrorBoundary>
          <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
            <Header />
            <main className="flex-1 px-4 py-4 pb-20">{children}</main>
            <BottomNav />
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
