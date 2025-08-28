"use client";

import { UserProvider } from '@/context/UserContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ToastProvider } from '@/context/ToastContext';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <UserProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </UserProvider>
    </LanguageProvider>
  );
}
