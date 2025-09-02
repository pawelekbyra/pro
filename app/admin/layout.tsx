import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // W trybie deweloperskim (mock) omijamy weryfikację sesji, aby umożliwić dostęp do panelu admina
  if (process.env.NEXT_PUBLIC_USE_MOCK_DB === 'true') {
    return (
      <div className="admin-layout bg-gray-900 text-white min-h-screen">
        <header className="bg-gray-800 p-4 shadow-md">
          <h1 className="text-xl font-bold">Admin Panel (MOCK MODE)</h1>
        </header>
        <main className="p-6">{children}</main>
      </div>
    );
  }

  // Standardowa weryfikacja sesji dla środowiska produkcyjnego
  const session = await verifySession();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <div className="admin-layout bg-gray-900 text-white min-h-screen">
      <header className="bg-gray-800 p-4 shadow-md">
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
