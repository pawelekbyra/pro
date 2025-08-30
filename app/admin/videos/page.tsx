import { db, Video, User } from '@/lib/db';
import React from 'react';
import { verifySession } from '@/lib/auth';
import { mockDb } from '@/lib/mock-db';
import { revalidatePath } from 'next/cache';
import VideoManagementClient from './VideoManagementClient';

export const dynamic = 'force-dynamic';

export default async function VideoManagementPage() {
  const session = await verifySession();
  if (!session || session.user.role !== 'admin') {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">Unauthorized</h2>
        <p>You must be an admin to view this page.</p>
      </div>
    );
  }

  const videos = process.env.MOCK_API === 'true'
    ? mockDb.videos
    : await db.getVideos({ count: 100 });

  const users: User[] = process.env.MOCK_API === 'true'
    ? [{ id: 'user_mock_admin', username: 'admin', email: 'admin@example.com', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=user_mock_admin', displayName: 'Mock Admin', firstName: 'Mock', lastName: 'Admin', passwordHash: '', sessionVersion: 1 }]
    : await db.getAllUsers();

  async function createVideoAction(formData: FormData) {
    'use server';

    const currentSession = await verifySession();
    if (!currentSession || currentSession.user.role !== 'admin') {
      console.error('Unauthorized: Only admins can create videos.');
      return;
    }

    if (process.env.MOCK_API === 'true') {
      const authorId = formData.get('userId') as string;
      const author = users.find(u => u.id === authorId) ?? { id: 'user_mock_admin', username: 'admin', avatar: 'https://i.pravatar.cc/150?u=user_mock_admin' };

      const newVideoData = {
        id: `video_mock_${Date.now()}`,
        userId: author.id,
        username: author.username,
        description: formData.get('description') as string,
        mp4Url: formData.get('mp4Url') as string,
        hlsUrl: null,
        poster: formData.get('poster') as string || `https://picsum.photos/seed/${Date.now()}/1080/1920`,
        avatar: author.avatar,
        access: formData.get('access') as 'public' | 'secret',
        createdAt: Date.now(),
      };
      mockDb.createVideo(newVideoData);
      revalidatePath('/admin/videos');
      revalidatePath('/');
      return;
    }

    const authorId = formData.get('userId') as string;
    const author = users.find(u => u.id === authorId);

    if (!author) {
      console.error('Author not found');
      return;
    }

    const newVideoData: Omit<Video, 'id' | 'createdAt'> = {
      userId: author.id,
      username: author.username,
      description: formData.get('description') as string,
      mp4Url: formData.get('mp4Url') as string,
      hlsUrl: null,
      poster: formData.get('poster') as string || '',
      avatar: author.avatar,
      access: formData.get('access') as 'public' | 'secret',
    };

    try {
      await db.createVideo(newVideoData);
      revalidatePath('/admin/videos');
    } catch (error) {
      console.error('Failed to create video:', error);
    }
  }

  async function updateVideoAction(formData: FormData) {
    'use server';
    const currentSession = await verifySession();
    if (!currentSession || currentSession.user.role !== 'admin') {
      console.error('Unauthorized: Only admins can update videos.');
      return;
    }
    const videoId = formData.get('videoId') as string;
    if (!videoId) return;

    const updates: Partial<Omit<Video, 'id' | 'createdAt' | 'userId' | 'username'>> = {
      description: formData.get('description') as string,
      mp4Url: formData.get('mp4Url') as string,
      poster: formData.get('poster') as string,
      access: formData.get('access') as 'public' | 'secret',
    };

    try {
      await db.updateVideo(videoId, updates);
      revalidatePath('/admin/videos');
    } catch (error) {
      console.error('Failed to update video:', error);
    }
  }

  async function deleteVideoAction(formData: FormData) {
    'use server';
    const currentSession = await verifySession();
    if (!currentSession || currentSession.user.role !== 'admin') {
      console.error('Unauthorized: Only admins can delete videos.');
      return;
    }
    const videoId = formData.get('videoId') as string;
    if (!videoId) {
      return;
    }
    try {
      await db.deleteVideo(videoId);
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
        users={users}
        createVideoAction={createVideoAction}
        updateVideoAction={updateVideoAction}
        deleteVideoAction={deleteVideoAction}
      />
    </div>
  );
}