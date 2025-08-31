import { db, User } from '@/lib/db';
import { Slide, VideoSlide } from '@/lib/types';
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
    try {
      const currentSession = await verifySession();
      if (!currentSession || currentSession.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const authorId = formData.get('userId') as string;
      const author = users.find(u => u.id === authorId);
      if (!author) throw new Error('Author not found');

      const newSlideData: Omit<VideoSlide, 'id' | 'createdAt' | 'initialLikes' | 'isLiked' | 'initialComments'> = {
        type: 'video',
        userId: author.id,
        username: author.username,
        avatar: author.avatar || '',
        access: formData.get('access') as 'public' | 'secret',
        x: parseInt(formData.get('x') as string, 10),
        y: parseInt(formData.get('y') as string, 10),
        data: {
          description: formData.get('description') as string,
          mp4Url: formData.get('mp4Url') as string,
          hlsUrl: null,
          poster: formData.get('poster') as string || '',
        }
      };

      await db.createSlide(newSlideData);
      revalidatePath('/admin/slides');
      return { success: true };
    } catch (error) {
      console.error('Failed to create slide:', error);
      return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  async function updateSlideAction(formData: FormData): Promise<{ success: boolean, error?: string }> {
    'use server';
    try {
      const currentSession = await verifySession();
      if (!currentSession || currentSession.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      const slideId = formData.get('slideId') as string;
      if (!slideId) return { success: false, error: 'No slide ID provided' };

      const updates: Partial<Omit<VideoSlide, 'id' | 'createdAt' | 'userId' | 'username'>> = {
        access: formData.get('access') as 'public' | 'secret',
        data: {
          description: formData.get('description') as string,
          mp4Url: formData.get('mp4Url') as string,
          hlsUrl: null,
          poster: formData.get('poster') as string,
        }
      };

      const existingSlide = await db.getSlide(slideId);
      if (existingSlide?.type !== 'video') {
        throw new Error("Can only update video slides from the admin panel.");
      }

      const updatedData = { ...existingSlide.data, ...updates.data };
      const finalUpdates = { ...updates, data: updatedData };

      await db.updateSlide(slideId, finalUpdates);
      revalidatePath('/admin/slides');
      return { success: true };
    } catch (error) {
      console.error('Failed to update slide:', error);
      return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  async function deleteSlideAction(formData: FormData): Promise<{ success: boolean, error?: string }>{
    'use server';
    try {
      const currentSession = await verifySession();
      if (!currentSession || currentSession.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      const slideId = formData.get('slideId') as string;
      if (!slideId) return { success: false, error: 'No slide ID provided' };

      await db.deleteSlide(slideId);
      revalidatePath('/admin/slides');
      return { success: true };
    } catch (error) {
      console.error('Failed to delete slide:', error);
      return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
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