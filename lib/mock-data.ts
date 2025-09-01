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
