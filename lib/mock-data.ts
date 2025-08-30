import type { Grid } from './types';

// Create a grid of mock slides with different types
export const mockGrid: Grid = {
  '0,0': {
    id: 'video_mock_1',
    type: 'video',
    userId: 'user_mock_1',
    username: 'TestUser',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_1',
    access: 'public',
    createdAt: Date.now(),
    initialLikes: 1337,
    isLiked: false,
    initialComments: 42,
    x: 0,
    y: 0,
    data: {
      description: 'Pionowy slajd 1 (0,0). Przesuń w dół!',
      mp4Url: 'https://vod-progressive.pexels.com/video/856077/free-video-856077.mp4',
      hlsUrl: 'https://content.jwplatform.com/manifests/vM7nH0Kl.m3u8',
      poster: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217',
    },
  },
  '0,1': {
    id: 'video_mock_2',
    type: 'video',
    userId: 'user_mock_2',
    username: 'AnotherDev',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_2',
    access: 'public',
    createdAt: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    initialLikes: 9001,
    isLiked: true,
    initialComments: 128,
    x: 0,
    y: 1,
    data: {
      description: 'Centrum świata (0,1). Możesz iść w każdym kierunku!',
      mp4Url: 'https://vod-progressive.pexels.com/video/854386/free-video-854386.mp4',
      hlsUrl: 'https://test-streams.mux.dev/tos_ismc/main.m3u8',
      poster: 'https://durian.blender.org/wp-content/uploads/2010/06/poster_sintel_web.jpg',
    },
  },
  '1,1': {
    id: 'html_mock_1',
    type: 'html',
    userId: 'user_mock_html',
    username: 'HtmlWizard',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_html',
    access: 'public',
    createdAt: Date.now() - 1000 * 60 * 6, // 6 minutes ago
    initialLikes: 100,
    isLiked: false,
    initialComments: 10,
    x: 1,
    y: 1,
    data: {
      description: 'Interaktywny slajd HTML (1,1).',
      htmlContent: `
        <div style="background-color: #2c3e50; color: white; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: sans-serif;">
          <h1>Witaj na moim interaktywnym slajdzie!</h1>
          <p>To jest prosty tekst HTML, który będzie renderowany bezpośrednio w aplikacji.</p>
          <button onclick="alert('Kliknąłeś przycisk!')" style="padding: 10px 20px; font-size: 16px; margin-top: 20px; cursor: pointer; border: none; background-color: #3498db; color: white; border-radius: 5px;">
            Kliknij mnie!
          </button>
        </div>
      `,
    },
  },
  '0,2': {
    id: 'video_mock_3',
    type: 'video',
    userId: 'user_mock_1',
    username: 'TestUser',
    avatar: 'https://i.pravatar.cc/150?u=user_mock_1',
    access: 'public',
    createdAt: Date.now() - 1000 * 60 * 10, // 10 minutes ago
    initialLikes: 420,
    isLiked: false,
    initialComments: 69,
    x: 0,
    y: 2,
    data: {
      description: 'Pionowy slajd 3 (0,2). Tylko w górę!',
      mp4Url: 'https://vod-progressive.pexels.com/video/857195/free-video-857195.mp4',
      hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      poster: 'https://orange.blender.org/wp-content/themes/orange/images/splash.jpg',
    },
  },
  '1,0': {
    id: 'video_mock_meme',
    type: 'video',
    userId: 'user_mock_ai',
    username: 'JulesTheAI',
    avatar: 'https://i.pravatar.cc/150?u=ai_jules',
    access: 'public',
    createdAt: Date.now(),
    initialLikes: 2048,
    isLiked: false,
    initialComments: 256,
    x: 1,
    y: 0,
    data: {
      description: 'Jak powstają memy? Krótki film instruktażowy. (1,0)',
      mp4Url: 'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
      hlsUrl: null,
      poster: 'https://i.imgflip.com/2fm6x.jpg', // Drake Hotline Bling meme poster
    },
  },
  '-1,1': {
    id: 'game_mock_flappy',
    type: 'game',
    userId: 'user_mock_ai',
    username: 'JulesTheAI',
    avatar: 'https://i.pravatar.cc/150?u=ai_jules',
    access: 'public',
    createdAt: Date.now(),
    initialLikes: 9999,
    isLiked: true,
    initialComments: 512,
    x: -1,
    y: 1,
    data: {
      description: 'Zagraj w Flappy Div! (-1,1)',
    },
  },
};
