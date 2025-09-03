'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const LocationProvider = dynamic(
  () => import('@/contexts/LocationContext').then((mod) => ({
    default: mod.LocationProvider
  })),
  { ssr: false }
);

export function ClientProviders({ children }: { children: ReactNode }) {
  return <LocationProvider>{children}</LocationProvider>;
}