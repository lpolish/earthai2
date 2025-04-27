import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LocationProvider } from '@/contexts/LocationContext';

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <LocationProvider>
          {children}
        </LocationProvider>
      </body>
    </html>
  );
}
