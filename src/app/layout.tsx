import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "mistral-Mi — محلل البورصة المصرية بالذكاء الاصطناعي",
  description: "تحليل فني وتوصيات ذكية لأسهم البورصة المصرية بالذكاء الاصطناعي",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "mistral-Mi" },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: [{ url: "/icon-180.png" }] },
};

export const viewport: Viewport = {
  themeColor: "#0a0f1c", width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}