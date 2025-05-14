import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import dynamic from 'next/dynamic';
import AuthProvider from '@/providers/AuthProvider';

const inter = Inter({ subsets: ["latin"] });

const ClientLocationProvider = dynamic(
  () => import('@/contexts/LocationContext').then((mod) => {
    return { default: mod.LocationProvider };
  }),
  { ssr: false }
);

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
        <AuthProvider>
          <ClientLocationProvider>
            {children}
          </ClientLocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
