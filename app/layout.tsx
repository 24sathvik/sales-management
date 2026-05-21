import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syne, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap"
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "ZyOps",
  description: "Generic operations management platform by ZyOps",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZyOps",
  },
};

export const viewport = {
  themeColor: "#FAFAF2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans text-body`}>
        <Providers>
          {children}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#FAFAF2',
                border: '1px solid #D8D4C0',
                color: '#2D2A20',
                fontFamily: 'var(--font-body)',
                fontSize: '13.5px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(28,26,20,0.12)'
              },
              classNames: {
                success: 'border-l-4 !border-l-[#22C55E]',
                error: 'border-l-4 !border-l-[#EF4444]',
                warning: 'border-l-4 !border-l-[#F59E0B]',
                info: 'border-l-4 !border-l-[#3B82F6]'
              }
            }}
          />
        </Providers>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
