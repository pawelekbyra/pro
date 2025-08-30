import { mockVideos as originalMockVideos, HydratedVideo } from './mock-data';
import { Comment, User } from './db';

// Create a mutable copy of the mock data to simulate a database in memory.
let mockVideos: HydratedVideo[] = JSON.parse(JSON.stringify(originalMockVideos));

// We can also store other mock data here, like users, comments, etc.
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


export const mockDb = {
  videos: mockVideos,
  comments: mockComments,
  createVideo: (video: Omit<HydratedVideo, 'initialLikes' | 'isLiked' | 'initialComments'>) => {
    const newVideo: HydratedVideo = {
      ...video,
      initialLikes: 0,
      isLiked: false,
      initialComments: 0,
    };
    mockVideos.unshift(newVideo);
    return newVideo;
  }
};

// Function to reset the mock database to its initial state.
// This can be useful for testing.
export function resetMockDb() {
  mockVideos = JSON.parse(JSON.stringify(originalMockVideos));
  mockDb.videos = mockVideos;
  // We might want to reset comments as well if we add more functionality
}
