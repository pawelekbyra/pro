import { db } from '@/lib/db';
import React from 'react';
import { revalidatePath } from 'next/cache';
import VideoManagementClient from './VideoManagementClient';

export default async function VideoManagementPage() {
  const videos = await db.getSlides();

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
      <VideoManagementClient videos={videos} deleteVideoAction={deleteVideoAction} />
    </div>
  );
}
