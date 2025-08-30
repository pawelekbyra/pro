import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import React from 'react';

// This layout will protect all routes under /admin
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = await verifySession();

  if (!payload || payload.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <html lang="pl">
      <body>
        <div className="min-h-screen bg-gray-900 text-white">
          <header className="bg-gray-800 p-4 shadow-md">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </header>
          <main className="p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
