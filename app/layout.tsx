import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

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
      <body className={cn("antialiased", inter.className)}>
        {children}
      </body>
    </html>
  );
}
