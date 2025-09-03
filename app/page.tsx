"use client";

import React from 'react';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

// --- React Query Client ---
const queryClient = new QueryClient();

import MainFeed from '@/components/MainFeed';

// --- Main Page Export ---
export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainFeed />
    </QueryClientProvider>
  );
}