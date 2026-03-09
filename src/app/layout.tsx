import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "Online Faculty Evaluation System - Camarines Norte State College",
  description: "Comprehensive online faculty evaluation system for the College of Trades and Technology, Camarines Norte State College. Evaluate faculty performance with structured questionnaires and real-time reporting.",
  keywords: ["Faculty Evaluation", "Online Evaluation System", "CNSC", "College of Trades and Technology", "Camarines Norte State College", "Education", "Faculty Assessment"],
  authors: [{ name: "College of Trades and Technology" }],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Online Faculty Evaluation System",
    description: "Comprehensive online faculty evaluation system for the College of Trades and Technology, Camarines Norte State College.",
    url: "/",
    siteName: "Online Faculty Evaluation System",
    type: "website",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "Online Faculty Evaluation System Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Faculty Evaluation System",
    description: "Comprehensive online faculty evaluation system for the College of Trades and Technology, Camarines Norte State College.",
    images: ["/favicon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8B0000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
