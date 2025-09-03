import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from '@/components/ClientProviders';

export const metadata: Metadata = {
  title: "EarthAI",
  description: "A location-aware AI assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
