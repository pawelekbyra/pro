// lib/mock-data.ts
import type { Grid } from './types';

const colors = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33A1',
  '#A133FF', '#33FFA1', '#FFC300', '#C70039',
  '#900C3F', '#581845', '#FFD700', '#00FF7F',
  '#00BFFF', '#FF69B4', '#7B68EE', '#32CD32'
];

export const mockGrid: Grid = {};

for (let i = 0; i < 16; i++) {
  const x = i % 4;
  const y = Math.floor(i / 4);
  mockGrid[`${x},${y}`] = {
    id: `slide-${x}-${y}`,
    type: 'html',
    x,
    y,
    userId: `user${i}`,
    username: `User ${i}`,
    avatar: `https://i.pravatar.cc/150?u=user${i}`,
    access: 'public',
    createdAt: Date.now(),
    initialLikes: 0,
    isLiked: false,
    initialComments: 0,
    data: {
      htmlContent: `<div style="background-color: ${colors[i]}; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; font-size: 2rem;"><span>Caption ${i}</span><span style="font-size: 1rem;">@User ${i}</span></div>`,
    },
  };
}

export const mockComments = []; // Pusta tablica, aby uniknąć problemów z mockami
export const mockNotifications = []; // Pusta tablica, aby uniknąć problemów z mockami
