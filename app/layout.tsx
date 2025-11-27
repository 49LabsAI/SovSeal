import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet/WalletProvider";
import { Navigation, Footer } from "@/components/layout";
import { ToastProvider, SkipToContent } from "@/components/ui";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Lockdrop - Guaranteed by math, not corporations",
  description: "Lockdrop: Decentralized time-capsule for time-locked audio/video messages with blockchain-enforced privacy",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Lockdrop",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-gray-900 flex flex-col min-h-screen">
        <SkipToContent />
        <ToastProvider>
          <WalletProvider>
            <Navigation />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </WalletProvider>
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
