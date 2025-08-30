import { mockGrid } from './mock-data';
import type { Grid, Slide, User, Comment } from './types';

// In-memory store for mock data
let slides: Grid = JSON.parse(JSON.stringify(mockGrid)); // Deep copy to avoid modifying the original
let users: { [id: string]: User } = {};
let comments: { [id: string]: Comment } = {};

// Mock database object
export const db = {
  // --- User Functions ---
  async findUserById(id: string): Promise<User | undefined> {
    return users[id];
  },

  async createUser(userData: Omit<User, 'id' | 'sessionVersion'>): Promise<User> {
    const id = `user_${crypto.randomUUID()}`;
    const user: User = { ...userData, id, sessionVersion: 1 };
    users[id] = user;
    return user;
  },

  // --- Slide Functions ---
  async getSlidesInView(options: { x: number, y: number, width: number, height: number, currentUserId?: string }) {
    // This is a simplified version for the mock.
    // The real implementation fetches a view, but here we just return the whole grid.
    return Object.values(slides);
  },

  async getAllSlides(): Promise<Slide[]> {
    return Object.values(slides);
  },

  // --- Like Functions ---
  async toggleLike(slideId: string, userId: string): Promise<{ newStatus: 'liked' | 'unliked', likeCount: number }> {
    const slide = Object.values(slides).find(s => s.id === slideId);
    if (!slide) {
      throw new Error('Slide not found');
    }

    const isLiked = slide.isLiked;
    const newStatus = isLiked ? 'unliked' : 'liked';
    slide.isLiked = !isLiked;
    slide.initialLikes += isLiked ? -1 : 1;

    return { newStatus, likeCount: slide.initialLikes };
  },

  // --- Comment Functions ---
  async getComments(slideId: string) {
    return Object.values(comments).filter(c => c.slideId === slideId).sort((a, b) => b.createdAt - a.createdAt);
  },

  async addComment(slideId: string, userId: string, text: string, parentId: string | null = null) {
    const user = await this.findUserById(userId) || { displayName: 'Mock User', avatar: '' };
    const commentId = `comment_${crypto.randomUUID()}`;
    const newComment: Comment = {
      id: commentId,
      slideId,
      userId,
      text,
      parentId,
      createdAt: Date.now(),
      likedBy: [],
      user: { displayName: user.displayName, avatar: user.avatar },
      replies: [],
    };
    comments[commentId] = newComment;

    // Also add to the slide's comment count for consistency
    const slide = Object.values(slides).find(s => s.id === slideId);
    if (slide) {
      slide.initialComments += 1;
    }

    return newComment;
  },

  async toggleCommentLike(commentId: string, userId: string) {
    const comment = comments[commentId];
    if (!comment) {
      throw new Error('Comment not found');
    }
    const index = comment.likedBy.indexOf(userId);
    if (index > -1) {
      comment.likedBy.splice(index, 1);
    } else {
      comment.likedBy.push(userId);
    }
    return { success: true };
  },

  // --- Notification Functions ---
  async getNotifications(userId: string, lang: string = 'en') {
    // Return a fixed list of mock notifications
    return [
      { id: 'notif_1', type: 'message', preview: lang === 'pl' ? 'Nowa wiadomość od Admina' : 'New message from Admin', time: '2 mins ago', full: 'Full message content here.', unread: true },
      { id: 'notif_2', type: 'profile', preview: lang === 'pl' ? 'Twój profil został zaktualizowany' : 'Your profile has been updated', time: '10 mins ago', full: 'Full message content here.', unread: true },
    ];
  },

  async markNotificationAsRead(notificationId: string) {
    // This is a no-op in the mock environment, as we don't persist notification state.
    return { success: true };
  },
};
