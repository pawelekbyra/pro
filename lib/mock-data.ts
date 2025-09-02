// lib/mock-data.ts
import type { Grid } from './types';

const colors = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33A1',
  '#A133FF', '#33FFA1', '#FFC300', '#C70039',
  '#900C3F', '#581845', '#FFD700', '#00FF7F',
  '#00BFFF', '#FF69B4', '#7B68EE', '#32CD32'
];

export const mockGrid: Grid = {};

const numColumns = 4;
const numSlidesPerColumn = 10;

for (let x = 0; x < numColumns; x++) {
  for (let y = 0; y < numSlidesPerColumn; y++) {
    const slideIndex = x * numSlidesPerColumn + y;
    mockGrid[`${x},${y}`] = {
      id: `slide-${x}-${y}`,
      type: 'html',
      x,
      y,
      userId: `user${slideIndex}`,
      username: `User ${slideIndex}`,
      avatar: `https://i.pravatar.cc/150?u=user${slideIndex}`,
      access: 'public',
      createdAt: Date.now(),
      initialLikes: 0,
      isLiked: false,
      initialComments: 0,
      data: {
        htmlContent: `<div style="background-color: ${colors[slideIndex % colors.length]}; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; font-size: 2rem;"><span>Slide (${x}, ${y})</span><span style="font-size: 1rem;">@User ${slideIndex}</span></div>`,
      },
    };
  }
}

export const mockComments = []; // Pusta tablica, aby uniknąć problemów z mockami
export const mockNotifications = []; // Pusta tablica, aby uniknąć problemów z mockami

mockGrid['0,2'] = {
  id: 'video-slide-1',
  type: 'video',
  x: 0,
  y: 2,
  userId: 'admin',
  username: 'admin',
  avatar: 'https://i.pravatar.cc/150?u=admin',
  access: 'public',
  createdAt: Date.now(),
  initialLikes: 42,
  isLiked: false,
  initialComments: 2,
  data: {
    mp4Url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    hlsUrl: null,
    poster: '',
    title: 'Big Buck Bunny',
    description: 'A short clip of Big Buck Bunny.',
  },
};

mockGrid['0,3'] = {
  id: 'video-slide-2',
  type: 'video',
  x: 0,
  y: 3,
  userId: 'admin',
  username: 'admin',
  avatar: 'https://i.pravatar.cc/150?u=admin',
  access: 'public',
  createdAt: Date.now(),
  initialLikes: 1337,
  isLiked: false,
  initialComments: 5,
  data: {
    mp4Url: 'https://test-videos.co.uk/vids/elephantsdream/mp4/h264/360/Elephants_Dream_360_10s_1MB.mp4',
    hlsUrl: null,
    poster: '',
    title: 'Elephants Dream',
    description: 'A short clip of Elephants Dream.',
  },
};

mockGrid['0,4'] = {
  id: 'video-slide-3',
  type: 'video',
  x: 0,
  y: 4,
  userId: 'admin',
  username: 'admin',
  avatar: 'https://i.pravatar.cc/150?u=admin',
  access: 'public',
  createdAt: Date.now(),
  initialLikes: 2048,
  isLiked: true,
  initialComments: 12,
  data: {
    mp4Url: 'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
    hlsUrl: null,
    poster: '',
    title: 'Sintel',
    description: 'A short clip of Sintel.',
  },
};
