'use client';

import { User } from '@/lib/db';
import React from 'react';

interface UserManagementClientProps {
  users: User[];
  deleteUserAction: (formData: FormData) => Promise<void>;
}

export default function UserManagementClient({ users, deleteUserAction }: UserManagementClientProps) {
  return (
    <div className="bg-gray-800 shadow-md rounded-lg p-4">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="p-2">Display Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Role</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
              <td className="p-2">{user.displayName}</td>
              <td className="p-2">{user.email}</td>
             <td className="p-2 capitalize">{user.role}</td>
              <td className="p-2">
                <form action={deleteUserAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded disabled:opacity-50"
                    // Prevent admin from deleting themselves
                     disabled={user.role === 'admin'}
                     title={user.role === 'admin' ? "Cannot delete an admin account" : "Delete user"}
                  >
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
