import { db, User } from '@/lib/db';
import { Slide } from '@/lib/types';
import React from 'react';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import SlideManagementClient from './SlideManagementClient';

export const dynamic = 'force-dynamic';

export default async function SlideManagementPage() {
  const session = await verifySession();
  if (!session || session.user.role !== 'admin') {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">Unauthorized</h2>
        <p>You must be an admin to view this page.</p>
      </div>
    );
  }

  // Use the new getAllSlides function
  const slides = await db.getAllSlides();
  const users: User[] = await db.getAllUsers();

  async function createSlideAction(formData: FormData): Promise<{ success: boolean, error?: string }> {
    'use server';
    return { success: false, error: 'Slide creation is disabled' };
  }

  async function updateSlideAction(formData: FormData): Promise<{ success: boolean, error?: string }> {
    'use server';
    return { success: false, error: 'Slide update is disabled' };
  }

  async function deleteSlideAction(formData: FormData): Promise<{ success: boolean, error?: string }>{
    'use server';
    return { success: false, error: 'Slide deletion is disabled' };
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Slide Management</h2>
      <SlideManagementClient
        slides={slides}
        users={users}
        createSlideAction={createSlideAction}
        updateSlideAction={updateSlideAction}
        deleteSlideAction={deleteSlideAction}
      />
    </div>
  );
}