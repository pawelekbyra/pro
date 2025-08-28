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
  sessionVersion: number;
  role: 'user' | 'creator' | 'patron' | 'admin';
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
  autoPlay?: boolean;
  loopVideo?: boolean;
}

export interface Like {
  slideId: string;
  userId: string;
}

export interface Comment {
  id: string;
  slideId: string;
  userId: string;
  text: string;
  createdAt: string;
  likedBy: string[]; // Array of userIds
}

export interface DbData {
  users: User[];
  slides: Slide[];
  likes: Like[];
  comments: Comment[];
}

const dbPath = path.join(process.cwd(), 'data.json');

// --- In-Memory Cache ---
let cache: {
  data: DbData | null;
  timestamp: number | null;
} = {
  data: null,
  timestamp: null,
};
const CACHE_DURATION_MS = 60 * 1000; // 1 minute

// --- Internal Functions ---

async function readDb(): Promise<DbData> {
  const now = Date.now();
  // Return from cache if it's not null and not expired
  if (cache.data && cache.timestamp && (now - cache.timestamp < CACHE_DURATION_MS)) {
    return cache.data;
  }

  try {
    const fileContents = await fs.readFile(dbPath, 'utf8');
    const data = JSON.parse(fileContents) as DbData;

    // Ensure comments array exists for backward compatibility
    if (!data.comments) {
      data.comments = [];
    }

    // Patch users to include a default role if it's missing
    data.users = data.users.map(user => ({
      ...user,
      role: user.role || 'user'
    }));

    // Update cache
    cache = { data, timestamp: now };

    return data;
  } catch (error) {
    console.error('Error reading from database:', error);
    // If the file doesn't exist or is corrupted, return a default structure
    const defaultData = { users: [], slides: [], likes: [], comments: [] };
    cache = { data: defaultData, timestamp: now }; // Also cache the default structure
    return defaultData;
  }
}

// Function to invalidate the cache whenever we write to the DB
function invalidateCache() {
  cache = { data: null, timestamp: null };
}

async function writeDb(data: DbData): Promise<void> {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
    // Invalidate cache after a successful write
    invalidateCache();
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

  async findUserById(id:string): Promise<User | undefined> {
    const data = await readDb();
    return data.users.find(user => user.id === id);
  },

  async getAllUsers(): Promise<User[]> {
    const data = await readDb();
    return data.users;
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
    // Also delete user's comments
    data.comments = data.comments.filter(comment => comment.userId !== userId);

    await writeDb(data);
    return true;
  },

  async deleteSlide(slideId: string): Promise<boolean> {
    const data = await readDb();
    const slideIndex = data.slides.findIndex(s => s.id === slideId);

    if (slideIndex === -1) {
      return false; // Slide not found
    }
    const slideLikeId = data.slides[slideIndex].likeId;

    // Remove slide
    data.slides.splice(slideIndex, 1);
    // Remove associated likes
    data.likes = data.likes.filter(like => like.slideId !== slideLikeId);
    // Remove associated comments
    data.comments = data.comments.filter(comment => comment.slideId !== slideId);

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
  },

  async incrementSessionVersion(userId: string): Promise<boolean> {
    const data = await readDb();
    const userIndex = data.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return false;
    }

    data.users[userIndex].sessionVersion = (data.users[userIndex].sessionVersion || 1) + 1;
    await writeDb(data);
    return true;
  },

  async getComments(slideId: string) {
    const data = await readDb();
    const commentsForSlide = data.comments.filter(c => c.slideId === slideId);

    const commentsWithUserInfo = commentsForSlide.map(comment => {
      const user = data.users.find(u => u.id === comment.userId);
      return {
        ...comment,
        user: user ? { displayName: user.displayName, avatar: user.avatar } : { displayName: 'Unknown User', avatar: '' }
      };
    });

    return commentsWithUserInfo.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addComment(slideId: string, userId: string, text: string) {
    const data = await readDb();
    const user = data.users.find(u => u.id === userId);

    if (!user) {
      throw new Error('User not found to add comment.');
    }

    const newComment: Comment = {
      id: crypto.randomUUID(),
      slideId,
      userId,
      text,
      createdAt: new Date().toISOString(),
      likedBy: [],
    };

    data.comments.push(newComment);
    await writeDb(data);

    return {
      ...newComment,
      user: {
        displayName: user.displayName,
        avatar: user.avatar,
      }
    };
  }
};
