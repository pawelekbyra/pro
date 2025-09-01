import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/Providers";
import AppLayout from "@/components/AppLayout";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ting Tong",
  description: "Ting Tong — pionowy feed wideo z prefetchingiem i trybem HLS/CDN-ready.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
          {/* Poprawiona meta tag viewport */}
          <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
          <meta name="theme-color" content="#000000" />
      </head>
      <body className={cn("antialiased", inter.className)}>
        <Providers>
          <AppLayout>{children}</AppLayout>
          <PWAInstallPrompt />
        </Providers>
        <Script
          data-name="BMC-Widget"
          data-cfasync="false"
          src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
          data-id="pawelperfect"
          data-description="Support me on Buy me a coffee!"
          data-message=""
          data-color="#FF5F5F"
          data-position="Right"
          data-x_margin="18"
          data-y_margin="18"
        />
      </body>
    </html>
  );
}
