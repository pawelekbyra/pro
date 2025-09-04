import { db } from '@/lib/db';
import React from 'react';
import { revalidatePath } from 'next/cache';
import UserManagementClient from './UserManagementClient';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function UserManagementPage() {
  const payload = await verifySession();
  if (!payload || payload.user.role !== 'admin') {
    redirect('/admin/login');
  }

  const users = await db.getAllUsers();

  async function deleteUserAction(formData: FormData) {
    'use server';
    const userId = formData.get('userId') as string;
    if (!userId) {
      return;
    }

    try {
      await db.deleteUser(userId);
      revalidatePath('/admin/users'); // Revalidate the page to show the updated list
    } catch (error) {
      console.error('Failed to delete user:', error);
      // Here you could return an error message to the client
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">User Management</h2>
      <UserManagementClient users={users} deleteUserAction={deleteUserAction} />
    </div>
  );
}
