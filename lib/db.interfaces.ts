// This file contains the core data interfaces used in lib/db.ts
// It is separated to avoid circular dependencies when types are needed in other files.

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar: string;
  sessionVersion: number;
  role: 'user' | 'creator' | 'patron' | 'admin';
}

export interface Comment {
  id: string;
  slideId: string; // Changed from videoId
  userId: string;
  text: string;
  createdAt: number; // Unix timestamp
  likedBy: string[]; // Array of userIds
  // This can be hydrated with user info
  user?: {
    displayName: string;
    avatar: string;
  }
}
