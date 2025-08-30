import type { Video } from './db';

// The frontend component expects a few extra fields that are normally
// constructed by the `db.getVideos` function. We'll define a type for it.
export type HydratedVideo = Video & {
  initialLikes: number;
  isLiked: boolean;
  initialComments: number;
};

// New types for the grid structure
export type Slide = HydratedVideo & {
  x: number;
  y: number;
};

export type Grid = {
  [key: string]: Slide;
};

// Create a grid of mock videos
export const mockGrid: Grid = {
  '0,0': {
    id: 'video_mock_1',
    userId: 'user_mock_1',
    username: 'TestUser',
    description: 'Pionowy slajd 1 (0,0). Przesuń w dół!',
    mp4Url: 'https://vod-progressive.pexels.com/video/856077/free-video-856077.mp4',
    hlsUrl: 'https://content.jwplatform.com/manifests/vM7nH0Kl.m3u8',
    poster: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_1',
    access: 'public',
    createdAt: Date.now(),
    initialLikes: 1337,
    isLiked: false,
    initialComments: 42,
    x: 0,
    y: 0,
  },
  '0,1': {
    id: 'video_mock_2',
    userId: 'user_mock_2',
    username: 'AnotherDev',
    description: 'Centrum świata (0,1). Możesz iść w każdym kierunku!',
    mp4Url: 'https://vod-progressive.pexels.com/video/854386/free-video-854386.mp4',
    hlsUrl: 'https://test-streams.mux.dev/tos_ismc/main.m3u8',
    poster: 'https://durian.blender.org/wp-content/uploads/2010/06/poster_sintel_web.jpg',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_2',
    access: 'public',
    createdAt: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    initialLikes: 9001,
    isLiked: true,
    initialComments: 128,
    x: 0,
    y: 1,
  },
  '0,2': {
    id: 'video_mock_3',
    userId: 'user_mock_1',
    username: 'TestUser',
    description: 'Pionowy slajd 3 (0,2). Tylko w górę!',
    mp4Url: 'https://vod-progressive.pexels.com/video/857195/free-video-857195.mp4',
    hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    poster: 'https://orange.blender.org/wp-content/themes/orange/images/splash.jpg',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_1',
    access: 'public',
    createdAt: Date.now() - 1000 * 60 * 10, // 10 minutes ago
    initialLikes: 420,
    isLiked: false,
    initialComments: 69,
    x: 0,
    y: 2,
  },
  '1,1': {
    id: 'video_mock_4',
    userId: 'user_mock_3',
    username: 'GridExplorer',
    description: 'Poziomy slajd 1 (1,1). Przesuń w lewo lub w prawo!',
    mp4Url: 'https://vod-progressive.pexels.com/video/854145/free-video-854145.mp4',
    hlsUrl: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/adv_dv_atmos/main.m3u8',
    poster: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_3',
    access: 'public',
    createdAt: Date.now() - 1000 * 60 * 7, // 7 minutes ago
    initialLikes: 500,
    isLiked: false,
    initialComments: 30,
    x: 1,
    y: 1,
  },
  '2,1': {
    id: 'video_mock_5',
    userId: 'user_mock_3',
    username: 'GridExplorer',
    description: 'Poziomy slajd 2 (2,1). Tylko w lewo!',
    mp4Url: 'https://vod-progressive.pexels.com/video/857406/free-video-857406.mp4',
    hlsUrl: 'https://sample.vodobox.net/skate_phantom_flex_4k/skate_phantom_flex_4k.m3u8',
    poster: 'https://img.freepik.com/free-vector/abstract-vibrant-low-poly-banner-design_1048-14032.jpg',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_3',
    access: 'public',
    createdAt: Date.now() - 1000 * 60 * 8, // 8 minutes ago
    initialLikes: 250,
    isLiked: true,
    initialComments: 15,
    x: 2,
    y: 1,
  },
  '-1,1': {
    id: 'video_mock_6',
    userId: 'user_mock_4',
    username: 'LeftIsNewRight',
    description: 'Slajd po lewej stronie (-1,1). Tylko w prawo!',
    mp4Url: 'https://vod-progressive.pexels.com/video/857157/free-video-857157.mp4',
    hlsUrl: 'https://mnmedias.api.telequebec.tv/m3u8/29880.m3u8',
    poster: 'https://images.ctfassets.net/hrltx12pl8hq/28ECAQiPJZ78hxBAvryUQO/63102b1f7c5f359c293796541f53f905/weather-images-scenic-overlook.jpg?fit=fill&w=1200&h=630',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_4',
    access: 'public',
    createdAt: Date.now() - 1000 * 60 * 9, // 9 minutes ago
    initialLikes: 101,
    isLiked: false,
    initialComments: 22,
    x: -1,
    y: 1,
  },
};