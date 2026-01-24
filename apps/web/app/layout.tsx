import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavigationSidebar } from '@/components/navigation/navigation-sidebar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FreeWA - WhatsApp API",
  description: "Open Source WhatsApp Gateway built with NestJS, Next.js, and Baileys",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex h-screen">
          <NavigationSidebar />
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
