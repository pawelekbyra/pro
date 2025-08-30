import { db, Slide } from '@/lib/db';
import React from 'react';

export const dynamic = 'force-dynamic';
import { revalidatePath } from 'next/cache';
import VideoManagementClient from './VideoManagementClient';

export default async function VideoManagementPage() {
  const videos = await db.getSlides();

  async function createVideoAction(formData: FormData) {
    'use server';
    // Basic data extraction, needs more robust validation
    const newSlideData: Omit<Slide, 'id' | 'likeId'> = {
      user: formData.get('user') as string,
      description: formData.get('description') as string,
      mp4Url: formData.get('mp4Url') as string,
      hlsUrl: null, // HLS URL can be left null for now
      poster: formData.get('poster') as string || '',
      avatar: formData.get('avatar') as string,
      access: formData.get('access') as 'public' | 'secret',
    };

    try {
      await db.createSlide(newSlideData);
      revalidatePath('/admin/videos');
    } catch (error) {
      console.error('Failed to create video:', error);
      // Can return an error message
    }
  }

  async function updateVideoAction(formData: FormData) {
    'use server';
    const slideId = formData.get('slideId') as string;
    if (!slideId) return;

    const updates: Partial<Omit<Slide, 'id' | 'likeId'>> = {
      user: formData.get('user') as string,
      description: formData.get('description') as string,
      mp4Url: formData.get('mp4Url') as string,
      poster: formData.get('poster') as string,
      avatar: formData.get('avatar') as string,
      access: formData.get('access') as 'public' | 'secret',
    };

    try {
      await db.updateSlide(slideId, updates);
      revalidatePath('/admin/videos');
    } catch (error) {
      console.error('Failed to update video:', error);
    }
  }

  async function deleteVideoAction(formData: FormData) {
    'use server';
    const slideId = formData.get('slideId') as string;
    if (!slideId) {
      return;
    }

    try {
      await db.deleteSlide(slideId);
      revalidatePath('/admin/videos');
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Video Management</h2>
      <VideoManagementClient
        videos={videos}
        createVideoAction={createVideoAction}
        updateVideoAction={updateVideoAction}
        deleteVideoAction={deleteVideoAction}
      />
    </div>
  );
}
