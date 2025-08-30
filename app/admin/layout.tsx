import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
