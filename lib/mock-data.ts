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
    username: 'VerticalExplorer',
    description: 'Testujemy wideo obrócone o 90 stopni. 📐',
    mp4Url: 'https://chromium.googlesource.com/chromium/src/media/+raw/main/test/data/90rotation.mp4',
    hlsUrl: null,
    poster: 'https://picsum.photos/seed/poster1/1080/1920',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_1',
    access: 'public',
    createdAt: Date.now(),
    initialLikes: 101,
    isLiked: false,
    initialComments: 10,
  },
  {
    id: 'video_mock_2',
    userId: 'user_mock_2',
    username: 'BearLover90',
    description: 'Niedźwiedź w pionie! Obrót o 90 stopni. 🐻',
    mp4Url: 'https://chromium.googlesource.com/chromium/src/media/+raw/main/test/data/bear_rotate_90.mp4',
    hlsUrl: null,
    poster: 'https://picsum.photos/seed/poster2/1080/1920',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_2',
    access: 'public',
    createdAt: Date.now() - 1000 * 60 * 2, // 2 minutes ago
    initialLikes: 202,
    isLiked: true,
    initialComments: 20,
  },
  {
    id: 'video_mock_3',
    userId: 'user_mock_3',
    username: 'ColorMaster',
    description: 'Kolorowy test wideo obrócony o 90 stopni. 🎨',
    mp4Url: 'https://chromium.googlesource.com/chromium/src/media/+raw/main/test/data/four-colors-rot-90.mp4',
    hlsUrl: null,
    poster: 'https://picsum.photos/seed/poster3/1080/1920',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_3',
    access: 'public',
    createdAt: Date.now() - 1000 * 60 * 4, // 4 minutes ago
    initialLikes: 303,
    isLiked: false,
    initialComments: 30,
  },
  {
    id: 'video_mock_4',
    userId: 'user_mock_2',
    username: 'BearLover90',
    description: 'Ten sam niedźwiedź, ale obrócony o 270 stopni! 🔄',
    mp4Url: 'https://chromium.googlesource.com/chromium/src/media/+raw/main/test/data/bear_rotate_270.mp4',
    hlsUrl: null,
    poster: 'https://picsum.photos/seed/poster4/1080/1920',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_2',
    access: 'public',
    createdAt: Date.now() - 1000 * 60 * 6, // 6 minutes ago
    initialLikes: 404,
    isLiked: false,
    initialComments: 40,
  },
  {
    id: 'video_mock_5',
    userId: 'user_mock_4',
    username: 'CreativeCoder',
    description: 'Jeszcze więcej kolorów, tym razem obróconych o 270 stopni. 🌈',
    mp4Url: 'https://chromium.googlesource.com/chromium/src/media/+raw/main/test/data/four-colors-rot-270.mp4',
    hlsUrl: null,
    poster: 'https://picsum.photos/seed/poster5/1080/1920',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_4',
    access: 'public',
    createdAt: Date.now() - 1000 * 60 * 8, // 8 minutes ago
    initialLikes: 505,
    isLiked: true,
    initialComments: 50,
  },
];
