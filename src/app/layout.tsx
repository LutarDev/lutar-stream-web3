import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth-context";
import { ThirdwebProvider } from "thirdweb/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MirrorPlay - Web3 Live Streaming",
  description: "The future of live streaming with Web3 technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground`}>
        <ThirdwebProvider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen pt-16">
              {children}
            </main>
          </AuthProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
