import type { Video } from './db';

// The frontend component expects a few extra fields that are normally
// constructed by the `db.getVideos` function. We'll define a type for it.
export type HydratedVideo = Video & {
  initialLikes: number;
  isLiked: boolean;
  initialComments: number;
};

export const mockVideos: HydratedVideo[] = [
  {
    id: 'video_mock_1',
    userId: 'user_mock_1',
    username: 'TestUser',
    description: 'Oto pierwszy testowy film! 🎬 Cieszcie się widokiem.',
    mp4Url: 'https://test-videos.co.uk/vids/BigBuckBunny/MP4/1080/Big_Buck_Bunny_1080p_1mb.mp4',
    hlsUrl: null,
    poster: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_1',
    access: 'public',
    createdAt: Date.now(),
    initialLikes: 1337,
    isLiked: false,
    initialComments: 42,
  },
  {
    id: 'video_mock_2',
    userId: 'user_mock_2',
    username: 'AnotherDev',
    description: 'Kolejny niesamowity film testowy do obejrzenia. 🍿',
    mp4Url: 'https://test-videos.co.uk/vids/Sintel/MP4/1080/Sintel_1080p_1mb.mp4',
    hlsUrl: null,
    poster: 'https://durian.blender.org/wp-content/uploads/2010/06/poster_sintel_web.jpg',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_2',
    access: 'public',
    createdAt: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    initialLikes: 9001,
    isLiked: true,
    initialComments: 128,
  },
  {
    id: 'video_mock_3',
    userId: 'user_mock_1',
    username: 'TestUser',
    description: 'Trzeci, ostatni i zapierający dech w piersiach film! 🚀',
    mp4Url: 'https://test-videos.co.uk/vids/ElephantsDream/MP4/1080/Elephants_Dream_1080p_1mb.mp4',
    hlsUrl: null,
    poster: 'https://orange.blender.org/wp-content/themes/orange/images/splash.jpg',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_1',
    access: 'public',
    createdAt: Date.now() - 1000 * 60 * 10, // 10 minutes ago
    initialLikes: 420,
    isLiked: false,
    initialComments: 69,
  },
];
