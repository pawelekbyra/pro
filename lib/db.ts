import { kv } from './kv';

// --- Type definitions remain the same ---
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

// --- Public API for Database Operations (Refactored for Vercel KV) ---

export const db = {
  async findUserByEmail(email: string): Promise<User | undefined> {
    const users = (await kv.get<User[]>('users')) ?? [];
    return users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  },

  async findUserById(id: string): Promise<User | undefined> {
    const users = (await kv.get<User[]>('users')) ?? [];
    return users.find((user) => user.id === id);
  },

  async getAllUsers(): Promise<User[]> {
    return (await kv.get<User[]>('users')) ?? [];
  },

  async getSlides(userId?: string) {
    const [slides, likes] = await Promise.all([
      kv.get<Slide[]>('slides'),
      kv.get<Like[]>('likes'),
    ]);

    const safeSlides = slides ?? [];
    const safeLikes = likes ?? [];

    const slidesWithDynamicData = safeSlides.map((slide) => {
      const likesForSlide = safeLikes.filter(
        (like) => like.slideId === slide.likeId
      );
      return {
        ...slide,
        initialLikes: likesForSlide.length,
        isLiked: userId
          ? safeLikes.some((like) => like.userId === userId)
          : false,
        initialComments: 0,
      };
    });

    return slidesWithDynamicData;
  },

  async isEmailInUse(email: string, excludeUserId?: string): Promise<boolean> {
    const users = (await kv.get<User[]>('users')) ?? [];
    return users.some(
      (user) =>
        user.email.toLowerCase() === email.toLowerCase() &&
        user.id !== excludeUserId
    );
  },

  async updateUser(
    userId: string,
    updates: Partial<User>
  ): Promise<User | null> {
    const users = (await kv.get<User[]>('users')) ?? [];
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return null;
    }
    if ('passwordHash' in updates) {
      delete updates.passwordHash;
    }

    const updatedUser = { ...users[userIndex], ...updates };
    users[userIndex] = updatedUser;

    await kv.set('users', users);
    return updatedUser;
  },

  async updateUserPassword(
    userId: string,
    newPasswordHash: string
  ): Promise<boolean> {
    const users = (await kv.get<User[]>('users')) ?? [];
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return false;
    }

    users[userIndex].passwordHash = newPasswordHash;
    await kv.set('users', users);
    return true;
  },

  async deleteUser(userId: string): Promise<boolean> {
    const [users, likes, comments] = await Promise.all([
      kv.get<User[]>('users'),
      kv.get<Like[]>('likes'),
      kv.get<Comment[]>('comments'),
    ]);

    const safeUsers = users ?? [];
    const safeLikes = likes ?? [];
    const safeComments = comments ?? [];

    const userIndex = safeUsers.findIndex((u) => u.id === userId);
    if (userIndex === -1) return false;

    const newUsers = safeUsers.filter((u) => u.id !== userId);
    const newLikes = safeLikes.filter((l) => l.userId !== userId);
    const newComments = safeComments.filter((c) => c.userId !== userId);

    const tx = kv.multi();
    tx.set('users', newUsers);
    tx.set('likes', newLikes);
    tx.set('comments', newComments);
    await tx.exec();

    return true;
  },

  async deleteSlide(slideId: string): Promise<boolean> {
    const [slides, likes, comments] = await Promise.all([
      kv.get<Slide[]>('slides'),
      kv.get<Like[]>('likes'),
      kv.get<Comment[]>('comments'),
    ]);

    const safeSlides = slides ?? [];
    const safeLikes = likes ?? [];
    const safeComments = comments ?? [];

    const slideIndex = safeSlides.findIndex((s) => s.id === slideId);
    if (slideIndex === -1) return false;

    const slideLikeId = safeSlides[slideIndex].likeId;

    const newSlides = safeSlides.filter((s) => s.id !== slideId);
    const newLikes = safeLikes.filter((l) => l.slideId !== slideLikeId);
    const newComments = safeComments.filter((c) => c.slideId !== slideId);

    const tx = kv.multi();
    tx.set('slides', newSlides);
    tx.set('likes', newLikes);
    tx.set('comments', newComments);
    await tx.exec();

    return true;
  },

  async createSlide(slideData: Omit<Slide, 'id' | 'likeId'>): Promise<Slide> {
    const slides = (await kv.get<Slide[]>('slides')) ?? [];
    const maxLikeId = slides.reduce(
      (max, s) => Math.max(max, parseInt(s.likeId, 10) || 0),
      0
    );
    const newSlide: Slide = {
      ...slideData,
      id: `slide-${crypto.randomUUID()}`,
      likeId: (maxLikeId + 1).toString(),
    };
    slides.push(newSlide);
    await kv.set('slides', slides);
    return newSlide;
  },

  async updateSlide(
    slideId: string,
    updates: Partial<Omit<Slide, 'id' | 'likeId'>>
  ): Promise<Slide | null> {
    const slides = (await kv.get<Slide[]>('slides')) ?? [];
    const slideIndex = slides.findIndex((s) => s.id === slideId);

    if (slideIndex === -1) {
      return null;
    }

    const updatedSlide = { ...slides[slideIndex], ...updates };
    slides[slideIndex] = updatedSlide;

    await kv.set('slides', slides);
    return updatedSlide;
  },

  async toggleLike(
    slideId: string,
    userId: string
  ): Promise<{ newStatus: 'liked' | 'unliked'; likeCount: number }> {
    const likes = (await kv.get<Like[]>('likes')) ?? [];
    const likeIndex = likes.findIndex(
      (like) => like.slideId === slideId && like.userId === userId
    );

    if (likeIndex > -1) {
      likes.splice(likeIndex, 1);
    } else {
      likes.push({ slideId, userId });
    }

    await kv.set('likes', likes);
    const likeCount = likes.filter((l) => l.slideId === slideId).length;
    return { newStatus: likeIndex > -1 ? 'unliked' : 'liked', likeCount };
  },

  async incrementSessionVersion(userId: string): Promise<boolean> {
    const users = (await kv.get<User[]>('users')) ?? [];
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) return false;

    users[userIndex].sessionVersion =
      (users[userIndex].sessionVersion || 1) + 1;
    await kv.set('users', users);
    return true;
  },

  async getComments(slideId: string) {
    const [comments, users] = await Promise.all([
      kv.get<Comment[]>('comments'),
      kv.get<User[]>('users'),
    ]);

    const safeComments = comments ?? [];
    const safeUsers = users ?? [];

    const commentsForSlide = safeComments.filter((c) => c.slideId === slideId);

    const commentsWithUserInfo = commentsForSlide.map((comment) => {
      const user = safeUsers.find((u) => u.id === comment.userId);
      return {
        ...comment,
        user: user
          ? { displayName: user.displayName, avatar: user.avatar }
          : { displayName: 'Unknown User', avatar: '' },
      };
    });

    return commentsWithUserInfo.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async addComment(slideId: string, userId: string, text: string) {
    const [comments, users] = await Promise.all([
      kv.get<Comment[]>('comments'),
      kv.get<User[]>('users'),
    ]);

    const safeComments = comments ?? [];
    const safeUsers = users ?? [];

    const user = safeUsers.find((u) => u.id === userId);
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

    safeComments.push(newComment);
    await kv.set('comments', safeComments);

    return {
      ...newComment,
      user: {
        displayName: user.displayName,
        avatar: user.avatar,
      },
    };
  },
};
