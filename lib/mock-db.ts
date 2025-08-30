import { mockGrid } from './mock-data';
import type { Grid, Slide } from './types';
import type { User, Comment } from './db.interfaces';

// In-memory store for mock data
let slides: Grid = JSON.parse(JSON.stringify(mockGrid)); // Deep copy to avoid modifying the original
let users: { [id: string]: User } = {};
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
    const notifications = [
      {
        id: 'notif_1',
        type: 'message',
        preview: lang === 'pl' ? 'Nowa wiadomość od Supportu' : 'New message from Support',
        time: '2 mins ago',
        full: lang === 'pl' ? 'Dziękujemy za zgłoszenie! Pracujemy nad rozwiązaniem Twojego problemu.' : 'Thanks for your report! We are working on a solution to your problem.',
        unread: true
      },
      {
        id: 'notif_2',
        type: 'profile',
        preview: lang === 'pl' ? 'Zdobyłeś nowe osiągnięcie!' : 'You have a new achievement!',
        time: '1 hour ago',
        full: lang === 'pl' ? 'Gratulacje! Odblokowałeś osiągnięcie "Mistrz Absurdu" za 100 obejrzanych slajdów.' : 'Congratulations! You have unlocked the "Master of Absurdity" achievement for watching 100 slides.',
        unread: true
      },
      {
        id: 'notif_3',
        type: 'offer',
        preview: lang === 'pl' ? 'Specjalna oferta dla Ciebie!' : 'Special offer for you!',
        time: '1 day ago',
        full: lang === 'pl' ? 'Otrzymaj 50% zniżki na zakup wirtualnej kawy dla dewelopera. Użyj kodu: JULES_RULEZ' : 'Get a 50% discount on the purchase of a virtual coffee for the developer. Use the code: JULES_RULEZ',
        unread: false
      },
    ];
    return notifications;
  },

  async markNotificationAsRead(notificationId: string) {
    // This is a no-op in the mock environment, as we don't persist notification state.
    return { success: true };
  },
};
