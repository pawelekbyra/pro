import { HydratedVideo, mockGrid } from './mock-data';
import type { Video } from './db';

// Flatten the grid into a simple array for the mock DB
const initialVideos: HydratedVideo[] = Object.values(mockGrid);

class MockDB {
  videos: HydratedVideo[];

  constructor(initialData: HydratedVideo[]) {
    // Deep copy to avoid modifying the original mockGrid object
    this.videos = JSON.parse(JSON.stringify(initialData));
  }

  createVideo(videoData: Omit<Video, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) {
    const newVideo: HydratedVideo = {
      ...videoData,
      id: videoData.id || `video_mock_${Date.now()}`,
      createdAt: videoData.createdAt || Date.now(),
      initialLikes: 0,
      isLiked: false,
      initialComments: 0,
    };
    this.videos.unshift(newVideo); // Add to the beginning of the array
    return newVideo;
  }
}

export const mockDb = new MockDB(initialVideos);
