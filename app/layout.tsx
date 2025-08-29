import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/Providers";
import AppLayout from "@/components/AppLayout";

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
      </head>
      <body className={cn("antialiased", inter.className)}>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
