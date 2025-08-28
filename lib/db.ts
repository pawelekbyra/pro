import { promises as fs } from 'fs';
import path from 'path';

// Define types for our data structures
export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar: string;
}

export interface Slide {
  id: string;
  likeId: string;
  user: string;
  description: string;
  mp4Url: string;
  hlsUrl: string | null;
  poster: string;
  avatar: string;
  access: 'public' | 'secret';
}

export interface Like {
  slideId: string;
  userId: string;
}

export interface DbData {
  users: User[];
  slides: Slide[];
  likes: Like[];
}

const dbPath = path.join(process.cwd(), 'data.json');

// --- Internal Functions ---

async function readDb(): Promise<DbData> {
  try {
    const fileContents = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(fileContents) as DbData;
  } catch (error) {
    console.error('Error reading from database:', error);
    // If the file doesn't exist or is corrupted, return a default structure
    return { users: [], slides: [], likes: [] };
  }
}

async function writeDb(data: DbData): Promise<void> {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to database:', error);
  }
}

// --- Public API for Database Operations ---

export const db = {
  async findUserByEmail(email: string): Promise<User | undefined> {
    const data = await readDb();
    return data.users.find(user => user.email.toLowerCase() === email.toLowerCase());
  },

  async findUserById(id: string): Promise<User | undefined> {
    const data = await readDb();
    return data.users.find(user => user.id === id);
  },

  async getSlides(userId?: string) {
    const data = await readDb();

    // Dynamically calculate like counts and if the current user liked the slide
    const slidesWithDynamicData = data.slides.map(slide => {
      const likesForSlide = data.likes.filter(like => like.slideId === slide.likeId);
      return {
        ...slide,
        initialLikes: likesForSlide.length,
        isLiked: userId ? likesForSlide.some(like => like.userId === userId) : false,
        initialComments: 0, // Mock comments for now
      };
    });

    return slidesWithDynamicData;
  },

  async isEmailInUse(email: string, excludeUserId?: string): Promise<boolean> {
    const data = await readDb();
    return data.users.some(user =>
      user.email.toLowerCase() === email.toLowerCase() && user.id !== excludeUserId
    );
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const data = await readDb();
    const userIndex = data.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return null;
    }

    // Prevent updating the password hash directly with this method
    if ('passwordHash' in updates) {
      delete updates.passwordHash;
    }

    const updatedUser = { ...data.users[userIndex], ...updates };
    data.users[userIndex] = updatedUser;

    await writeDb(data);
    return updatedUser;
  },

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const data = await readDb();
    const userIndex = data.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return false;
    }

    data.users[userIndex].passwordHash = newPasswordHash;
    await writeDb(data);
    return true;
  },

  async deleteUser(userId: string): Promise<boolean> {
    const data = await readDb();
    const userIndex = data.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return false; // User not found
    }

    // Remove user
    data.users.splice(userIndex, 1);
    // Remove user's likes
    data.likes = data.likes.filter(like => like.userId !== userId);

    await writeDb(data);
    return true;
  },

  async toggleLike(slideId: string, userId: string): Promise<{ newStatus: 'liked' | 'unliked', likeCount: number }> {
    const data = await readDb();
    const likeIndex = data.likes.findIndex(like => like.slideId === slideId && like.userId === userId);

    if (likeIndex > -1) {
      // Unlike
      data.likes.splice(likeIndex, 1);
      await writeDb(data);
      const likeCount = data.likes.filter(l => l.slideId === slideId).length;
      return { newStatus: 'unliked', likeCount };
    } else {
      // Like
      data.likes.push({ slideId, userId });
      await writeDb(data);
      const likeCount = data.likes.filter(l => l.slideId === slideId).length;
      return { newStatus: 'liked', likeCount };
    }
  }
};
