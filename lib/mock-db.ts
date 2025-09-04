import type { Grid, Slide } from './types';
import type { User, Comment } from './db.interfaces';

// In-memory store for mock data
const slides: Grid = {};
const NUM_SLIDES = 10;

// Data generation
(() => {
  if (Object.keys(slides).length > 0) return; // Generate only once
  for (let i = 0; i < NUM_SLIDES; i++) {
    const slideId = `mock_slide_${i}`;
    slides[slideId] = {
      id: slideId,
      x: 0, // No longer used, but schema might require it for now
      y: i, // No longer used
      type: 'video',
      initialLikes: Math.floor(Math.random() * 1000),
      initialComments: Math.floor(Math.random() * 200),
      isLiked: Math.random() > 0.5,
      avatar: `https://i.pravatar.cc/150?u=user_${i}`,
      userId: `user_${i}`,
      username: `User ${i}`,
      access: i === 1 ? 'secret' : 'public',
      createdAt: Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7, // within the last 7 days
      data: {
        hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        mp4Url: '',
        poster: `https://picsum.photos/seed/${i}/400/800`,
        title: `Mock Video Slide ${i}`,
        description: `This is a mock video slide, generated for testing.`,
      },
    };
  }
})();


let users: { [id: string]: User } = {
  "user_admin_01": {
    id: "user_admin_01",
    username: "admin",
    email: "admin",
    password: "$2b$10$cPzLYOVH./kw0c0bh93tL.2rMCzlqksiG/CILtgr3UuXsYbeSFMJq", // admin
    role: "admin",
    displayName: "Administrator",
    avatar: "https://i.pravatar.cc/150?u=admin",
    sessionVersion: 1,
  }
};
let comments: { [id: string]: Comment } = {
  "comment_1": {
    id: "comment_1",
    slideId: "company_pitch_1",
    userId: "user_1",
    text: "Wow, co to za labirynt? Wygląda super! 🔥",
    parentId: null,
    createdAt: Date.now() - 1000 * 60 * 5,
    likedBy: [],
    user: { displayName: "Użytkownik123", avatar: "https://i.pravatar.cc/150?u=user_1" },
    replies: [],
  },
  "comment_2": {
    id: "comment_2",
    slideId: "company_pitch_1",
    userId: "user_2",
    text: "Moc! 💪 Jedziemy z tym koksem!",
    parentId: null,
    createdAt: Date.now() - 1000 * 60 * 3,
    likedBy: ["user_1"],
    user: { displayName: "Tester_Oprogramowania", avatar: "https://i.pravatar.cc/150?u=user_2" },
    replies: [],
  },
  "comment_3": {
    id: "comment_3",
    slideId: "video_mock_meme",
    userId: "user_3",
    text: "Hahaha, dobre! 😂😂😂",
    parentId: null,
    createdAt: Date.now() - 1000 * 60 * 10,
    likedBy: [],
    user: { displayName: "MemeLord", avatar: "https://i.pravatar.cc/150?u=user_3" },
    replies: [],
  },
  "comment_4": {
    id: "comment_4",
    slideId: "video_mock_meme",
    userId: "user_4",
    text: "Rewelacja! ✨",
    parentId: null,
    createdAt: Date.now() - 1000 * 60 * 2,
    likedBy: [],
    user: { displayName: "Krytyk_Filmowy", avatar: "https://i.pravatar.cc/150?u=user_4" },
    replies: [],
  },
};

// Mock database object
export const db = {
  // --- User Functions ---
  async findUserByEmail(email: string): Promise<User | undefined> {
    return Object.values(users).find(user => user.email === email);
  },

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
  async getAllColumnCoords(): Promise<{ x: number }[]> {
    const allSlides = Object.values(slides);
    const columnCoords = [...new Set(allSlides.map(s => s.x))];
    return columnCoords.sort((a, b) => a - b).map(x => ({ x }));
  },

  async getSlidesInColumn(
    columnIndex: number,
    options: { offset?: number; limit?: number; currentUserId?: string }
  ): Promise<Slide[]> {
    const { offset = 0, limit = 10 } = options;
    const columnSlides = Object.values(slides)
      .filter(s => s.x === columnIndex)
      .sort((a, b) => a.y - b.y); // Ensure slides are ordered by their vertical index

    return columnSlides.slice(offset, offset + limit);
  },

  async getSlidesInView(options: { x: number, y: number, width: number, height: number, currentUserId?: string }) {
    // This is a simplified version for the mock.
    // The real implementation fetches a view, but here we just return the whole grid.
    return Object.values(slides);
  },

  async getAllSlides(): Promise<Slide[]> {
    return Object.values(slides);
  },

  async getSlides(options: { limit?: number, cursor?: string, currentUserId?: string }): Promise<Slide[]> {
    const { limit = 5, cursor } = options;
    const allSlides = Object.values(slides).sort((a, b) => b.createdAt - a.createdAt);

    if (!cursor) {
      return allSlides.slice(0, limit);
    }

    const cursorDate = new Date(parseInt(cursor, 10));
    const cursorIndex = allSlides.findIndex(slide => new Date(slide.createdAt) < cursorDate);

    if (cursorIndex === -1) {
      return [];
    }

    return allSlides.slice(cursorIndex, cursorIndex + limit);
  },

  async createSlide(slideData: Omit<Slide, 'id' | 'createdAt' | 'initialLikes' | 'isLiked' | 'initialComments'>): Promise<Slide> {
    const id = `slide_${crypto.randomUUID()}`;
    const newSlide = {
      ...slideData,
      id,
      createdAt: Date.now(),
      initialLikes: 0,
      initialComments: 0,
      isLiked: false,
    } as Slide;
    slides[id] = newSlide;
    return newSlide;
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
    const user = await this.findUserById(userId) || { username: 'mockuser', displayName: 'Mock User', avatar: '' };
    const commentId = `comment_${crypto.randomUUID()}`;
    const newComment: Comment = {
      id: commentId,
      slideId,
      userId,
      text,
      parentId,
      createdAt: Date.now(),
      likedBy: [],
      user: { displayName: user.displayName || user.username, avatar: user.avatar || '' },
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

  async toggleCommentLike(commentId: string, userId: string): Promise<{ newStatus: 'liked' | 'unliked', likeCount: number }> {
    const comment = comments[commentId];
    if (!comment) {
      throw new Error('Comment not found');
    }

    let newStatus: 'liked' | 'unliked';
    const index = comment.likedBy.indexOf(userId);

    if (index > -1) {
      // User has already liked, so unlike
      comment.likedBy.splice(index, 1);
      newStatus = 'unliked';
    } else {
      // User has not liked, so like
      comment.likedBy.push(userId);
      newStatus = 'liked';
    }

    return { newStatus, likeCount: comment.likedBy.length };
  },

  // --- Notification Functions ---
  async getNotifications(userId: string) {
    const notifications = [
      {
        id: 'notif_1',
        type: 'message',
        previewKey: 'mockNotif1Preview',
        fullKey: 'mockNotif1Full',
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        read: false,
        fromUser: {
          displayName: 'Support',
          avatar: 'https://i.pravatar.cc/150?u=support',
        },
      },
      {
        id: 'notif_2',
        type: 'follow', // Changed to a valid type
        previewKey: 'mockNotif2Preview',
        fullKey: 'mockNotif2Full',
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        read: false,
        fromUser: {
          displayName: 'System Osiągnięć',
          avatar: 'https://i.pravatar.cc/150?u=achievements',
        },
      },
      {
        id: 'notif_3',
        type: 'like', // Changed to a valid type
        previewKey: 'mockNotif3Preview',
        fullKey: 'mockNotif3Full',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        fromUser: {
          displayName: 'Dział Marketingu',
          avatar: 'https://i.pravatar.cc/150?u=marketing',
        },
      },
    ];
    return notifications;
  },

  async markNotificationAsRead(notificationId: string) {
    // This is a no-op in the mock environment, as we don't persist notification state.
    return { success: true };
  },

  async pingDb() {
    // No-op for mock db
    return Promise.resolve();
  },
};
