"use client";

import { UserProvider } from '@/context/UserContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ToastProvider } from '@/context/ToastContext';
import React from 'react';
import Preloader from './Preloader';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Preloader />
        <UserProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </UserProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
