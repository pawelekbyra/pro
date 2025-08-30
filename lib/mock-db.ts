import { mockGrid } from './mock-data';
import type { Video, Comment, User } from './db'; // Używamy typów z 'db'
import { VideoSlide } from './types';

// These types are redefined here for the mock database.
// This is a simplified version for the old video-only logic.
type HydratedVideo = Video & {
  initialLikes: number;
  isLiked: boolean;
  initialComments: number;
};

// Flatten the grid into a simple array for the mock DB
const initialVideos: HydratedVideo[] = Object.values(mockGrid)
  .filter((slide): slide is VideoSlide => slide.type === 'video')
  .map(slide => ({
    id: slide.id,
    userId: slide.userId,
    username: slide.username,
    description: slide.data.description,
    mp4Url: slide.data.mp4Url,
    hlsUrl: slide.data.hlsUrl,
    poster: slide.data.poster,
    avatar: slide.avatar,
    access: slide.access,
    createdAt: slide.createdAt,
    initialLikes: slide.initialLikes,
    isLiked: slide.isLiked,
    initialComments: slide.initialComments,
  }));

// Tworzymy mutowalną kopię danych, aby symulować bazę danych w pamięci.
let mockVideos: HydratedVideo[] = JSON.parse(JSON.stringify(initialVideos));

// Tutaj możemy przechowywać inne dane, takie jak komentarze
const mockComments: (Comment & { user: Partial<User> })[] = [
    {
        id: 'comment_mock_1',
        videoId: 'video_mock_1',
        userId: 'user_mock_2',
        text: 'Świetny film!',
        createdAt: Date.now() - 1000 * 60 * 3,
        likedBy: [],
        user: {
            displayName: 'AnotherDev',
            avatar: 'https://i.pravatar.cc/150?u=user_mock_2',
        }
    },
    {
        id: 'comment_mock_2',
        videoId: 'video_mock_1',
        userId: 'user_mock_3',
        text: 'Niesamowite ujęcie!',
        createdAt: Date.now() - 1000 * 60 * 2,
        likedBy: [],
        user: {
            displayName: 'ColorMaster',
            avatar: 'https://i.pravatar.cc/150?u=user_mock_3',
        }
    }
];

class MockDB {
  videos: HydratedVideo[];
  comments: (Comment & { user: Partial<User> })[];

  constructor(initialData: HydratedVideo[]) {
    this.videos = JSON.parse(JSON.stringify(initialData));
    this.comments = JSON.parse(JSON.stringify(mockComments));
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
    this.videos.unshift(newVideo); // Dodajemy na początek tablicy
    return newVideo;
  }
}

export const mockDb = new MockDB(initialVideos);

// Funkcja resetująca mockową bazę danych do stanu początkowego
export function resetMockDb() {
  mockDb.videos = JSON.parse(JSON.stringify(initialVideos));
  mockDb.comments = JSON.parse(JSON.stringify(mockComments));
}