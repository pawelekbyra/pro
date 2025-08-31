// lib/mock-data.ts
import type { Grid, Slide } from './types';

export const mockGrid: Grid = {
  '0,0': {
    id: 'intro_video',
    type: 'video',
    x: 0, y: 0,
    userId: 'jules_the_ai', username: 'JulesTheAI', avatar: 'https://i.pravatar.cc/150?u=ai_jules',
    access: 'public', createdAt: Date.now(), initialLikes: 1000, isLiked: false, initialComments: 50,
    data: {
      description: 'Zjawiskowy film, jakiego świat nie widział! #tingotong #art #wow',
      mp4Url: 'https://cdn.pixabay.com/video/2021/04/16/74542-535359404_large.mp4',
      hlsUrl: null,
      poster: 'https://images.pexels.com/videos/857195/free-video-857195.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    },
  },
  '0,1': {
    id: 'second_video',
    type: 'video',
    x: 0, y: 1,
    userId: 'jules_the_ai', username: 'JulesTheAI', avatar: 'https://i.pravatar.cc/150?u=ai_jules',
    access: 'public', createdAt: Date.now(), initialLikes: 500, isLiked: false, initialComments: 20,
    data: {
      description: 'Drugi, równie świetny film. #tingotong #cool',
      mp4Url: 'https://cdn.pixabay.com/video/2024/07/04/210355-103350293_large.mp4',
      hlsUrl: null,
      poster: 'https://images.pexels.com/videos/2022395/free-video-2022395.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    },
  },
  '0,2': {
    id: 'secret_video',
    type: 'video',
    x: 0, y: 2,
    userId: 'jules_the_ai', username: 'JulesTheAI', avatar: 'https://i.pravatar.cc/150?u=ai_jules',
    access: 'secret', // Ważne: ustawienie dostępu na 'secret'
    createdAt: Date.now(), initialLikes: 10, isLiked: false, initialComments: 5,
    data: {
      description: 'Top Secret: Film tylko dla Patronów Miłości! #tingotong #secret',
      mp4Url: 'https://cdn.pixabay.com/video/2022/02/10/106399-684499881_large.mp4',
      hlsUrl: null,
      poster: 'https://i.imgflip.com/2fm6x.jpg',
    },
  },
};

export const mockComments = []; // Pusta tablica, aby uniknąć problemów z mockami
export const mockNotifications = []; // Pusta tablica, aby uniknąć problemów z mockami
