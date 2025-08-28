"use client";

import { UserProvider } from '@/context/UserContext';
import { LanguageProvider } from '@/context/LanguageContext';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </LanguageProvider>
  );
}
