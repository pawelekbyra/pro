import Link from 'next/link';
import React from 'react';

export default function AdminPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Welcome to the Admin Dashboard</h2>
      <p className="mb-6">This is where you can manage users and slides.</p>
      <nav>
        <ul className="space-y-2">
          <li>
            <Link href="/admin/users" className="text-lg text-pink-400 hover:underline">
              Manage Users
            </Link>
          </li>
          <li>
            <Link href="/admin/slides" className="text-lg text-pink-400 hover:underline">
              Manage Slides
            </Link>
          </li>
          <li>
            <Link href="/admin/notifications" className="text-lg text-pink-400 hover:underline">
              Send Notifications
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
