import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import SWRegister from "./sw-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "800 Sport Rent",
  description: "Self-guided tours by 800 Sport Rent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#171717" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
