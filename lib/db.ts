import { kv } from './kv';
import { Slide } from './types';
import { User, Comment, Notification } from './db.interfaces';
import { db as mockDb } from './mock-db';

// --- Key Generation Functions ---
export const keys = {
  user: (userId: string) => `user:${userId}`,
  emailToId: (email: string) => `email_to_id:${email.toLowerCase()}`,
  usernameToId: (username: string) => `username_to_id:${username.toLowerCase()}`,
  userLikes: (userId: string) => `user_likes:${userId}`,
  userSlides: (userId: string) => `user_slides:${userId}`,
  userComments: (userId: string) => `user_comments:${userId}`,

  slide: (slideId: string) => `slide:${slideId}`,
  slideLikes: (slideId:string) => `slide_likes:${slideId}`,
  slideComments: (slideId: string) => `slide_comments:${slideId}`,

  gridSlides: () => 'grid_slides', // HASH "x,y" -> slideId

  comment: (commentId: string) => `comment:${commentId}`,
  commentLikes: (commentId: string) => `comment_likes:${commentId}`,

  notification: (notificationId: string) => `notification:${notificationId}`,
  userNotifications: (userId: string) => `user_notifications:${userId}`,
};

const vercelDb = {
  // --- User Functions ---
  async findUserByEmail(email: string): Promise<User | undefined> {
    const userId = await kv!.get<string>(keys.emailToId(email));
    return userId ? this.findUserById(userId) : undefined;
  },

  async findUserById(id: string): Promise<User | undefined> {
    const user = await kv!.get<User>(keys.user(id));
    return user ?? undefined;
  },

  async getAllUsers(): Promise<User[]> {
    const userKeys = await kv!.keys('user:*');
    if (!userKeys.length) return [];
    const users = await kv!.mget<User[]>(...userKeys);
    return users.filter(Boolean) as User[];
  },

  async createUser(userData: Omit<User, 'id' | 'sessionVersion'>): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = { ...userData, id, sessionVersion: 1 };
    const tx = kv!.multi();
    tx.set(keys.user(id), user);
    tx.set(keys.emailToId(user.email), id);
    tx.set(keys.usernameToId(user.username), id);
    await tx.exec();
    return user;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = await this.findUserById(userId);
    if (!user) return null;
    const updatedUser = { ...user, ...updates };
    await kv!.set(keys.user(userId), updatedUser);
    return updatedUser;
  },

  async deleteUser(userId: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    if (!user) return false;
    await kv!.del(keys.user(userId), keys.emailToId(user.email), keys.usernameToId(user.username));
    return true;
  },

  // --- Slide Functions ---
  async getSlide(slideId: string): Promise<Slide | null> {
    return kv!.get<Slide>(keys.slide(slideId));
  },

  async getAllSlides(): Promise<Slide[]> {
    const slideIds = await kv!.hvals(keys.gridSlides());
    if (!slideIds.length) return [];
    const slideKeys = slideIds.map((id: string) => keys.slide(id));
    const slides = await kv!.mget<Slide[]>(...slideKeys);
    return slides.filter(Boolean) as Slide[];
  },

  async getSlidesInView(options: { x: number, y: number, width: number, height: number, currentUserId?: string }) {
    const { x, y, width, height, currentUserId } = options;
    const coords: string[] = [];
    for (let j = y; j < y + height; j++) {
      for (let i = x; i < x + width; i++) {
        coords.push(`${i},${j}`);
      }
    }
    if (coords.length === 0) return [];

    const slideIdRecord = await kv!.hmget<Record<string, string | null>>(keys.gridSlides(), ...coords);
    if (!slideIdRecord) return [];

    const validSlideIds = Object.values(slideIdRecord).filter(Boolean) as string[];
    if (validSlideIds.length === 0) return [];

    const pipe = kv!.multi();
    for (const id of validSlideIds) {
      pipe.get(keys.slide(id));
      pipe.scard(keys.slideLikes(id));
      pipe.llen(keys.slideComments(id));
    }
    if (currentUserId) {
      pipe.sismember(keys.userLikes(currentUserId), validSlideIds);
    }
    const results = await pipe.exec();

    const slides: Slide[] = [];
    const userLikes = currentUserId ? (results.pop() as number[]).map(Boolean) : [];
    for (let i = 0; i < validSlideIds.length; i++) {
      const slideData = results[i * 3] as Slide | null;
      if (!slideData) continue;
      slides.push({
        ...slideData,
        initialLikes: results[i * 3 + 1] as number,
        initialComments: results[i * 3 + 2] as number,
        isLiked: currentUserId ? userLikes[i] : false,
      });
    }
    return slides;
  },

  async createSlide(slideData: Omit<Slide, 'id' | 'createdAt' | 'initialLikes' | 'isLiked' | 'initialComments'>): Promise<Slide> {
    const id = `slide_${crypto.randomUUID()}`;
    const createdAt = Date.now();
    const newSlide = { ...slideData, id, createdAt, initialLikes: 0, isLiked: false, initialComments: 0 };
    const coord = `${newSlide.x},${newSlide.y}`;
    const existingSlideId = await kv!.hget(keys.gridSlides(), coord);
    if (existingSlideId) throw new Error(`A slide already exists at coordinate ${coord}.`);

    const tx = kv!.multi();
    tx.set(keys.slide(id), newSlide);
    tx.hset(keys.gridSlides(), { [coord]: id });
    tx.sadd(keys.userSlides(newSlide.userId), id);
    await tx.exec();
    return newSlide as Slide;
  },

  async updateSlide(slideId: string, updates: Partial<Omit<Slide, 'id' | 'createdAt' | 'userId' | 'username' | 'x' | 'y'>>): Promise<Slide | null> {
    const slide = await this.getSlide(slideId);
    if (!slide) return null;
    const updatedSlide = { ...slide, ...updates };
    await kv!.set(keys.slide(slideId), updatedSlide);
    return updatedSlide as Slide;
  },

  async deleteSlide(slideId: string): Promise<boolean> {
    const slide = await this.getSlide(slideId);
    if (!slide) return false;
    const coord = `${slide.x},${slide.y}`;
    const tx = kv!.multi();
    tx.hdel(keys.gridSlides(), coord);
    tx.del(keys.slide(slideId), keys.slideLikes(slideId), keys.slideComments(slideId));
    await tx.exec();
    return true;
  },

  async toggleLike(slideId: string, userId: string): Promise<{ newStatus: 'liked' | 'unliked', likeCount: number }> {
    const slideLikesKey = keys.slideLikes(slideId);
    const userLikesKey = keys.userLikes(userId);
    const isLiked = await kv!.sismember(slideLikesKey, userId);
    const tx = kv!.multi();
    if (isLiked) {
      tx.srem(slideLikesKey, userId);
      tx.srem(userLikesKey, slideId);
    } else {
      tx.sadd(slideLikesKey, userId);
      tx.sadd(userLikesKey, slideId);
    }
    await tx.exec();
    const likeCount = await kv!.scard(slideLikesKey);
    return { newStatus: isLiked ? 'unliked' : 'liked', likeCount };
  },

  // --- Comment Functions ---
  async getComments(slideId: string, options: { start?: number, count?: number } = {}) {
    const { start = 0, count = 20 } = options;
    const commentIds = await kv!.lrange(keys.slideComments(slideId), start, start + count - 1);
    if (!commentIds.length) return [];
    const pipe = kv!.multi();
    for (const id of commentIds) {
      pipe.get(keys.comment(id as string));
    }
    const results = await pipe.exec() as (Comment | null)[];
    const comments = results.filter(Boolean) as Comment[];
    return this.hydrateCommentsWithUserInfo(comments);
  },

  async addComment(slideId: string, userId: string, text: string) {
    const user = await this.findUserById(userId);
    if (!user) throw new Error('User not found to add comment.');
    const commentId = `comment_${crypto.randomUUID()}`;
    const newComment: Comment = { id: commentId, slideId, userId, text, createdAt: Date.now(), likedBy: [] };
    const tx = kv!.multi();
    tx.set(keys.comment(commentId), newComment);
    tx.lpush(keys.slideComments(slideId), commentId);
    tx.sadd(keys.userComments(userId), commentId);
    await tx.exec();
    return { ...newComment, user: { displayName: user.displayName, avatar: user.avatar } };
  },

  async toggleCommentLike(commentId: string, userId: string): Promise<{ newStatus: 'liked' | 'unliked', likeCount: number }> {
    const commentKey = keys.comment(commentId);
    const commentLikesKey = keys.commentLikes(commentId);

    const [comment, liker, isLiked] = await Promise.all([
      kv!.get<Comment>(commentKey),
      this.findUserById(userId),
      kv!.sismember(commentLikesKey, userId),
    ]);

    if (!comment) throw new Error('Comment not found');
    if (!liker) throw new Error('Liker not found');

    const tx = kv!.multi();
    let newStatus: 'liked' | 'unliked';

    if (isLiked) {
      tx.srem(commentLikesKey, userId);
      const updatedLikedBy = comment.likedBy.filter(id => id !== userId);
      tx.set(commentKey, { ...comment, likedBy: updatedLikedBy });
      newStatus = 'unliked';
    } else {
      newStatus = 'liked';
      tx.sadd(commentLikesKey, userId);
      const updatedLikedBy = [...comment.likedBy, userId];
      tx.set(commentKey, { ...comment, likedBy: updatedLikedBy });

      // Create a notification for the comment author
      if (comment.userId !== userId) {
        this.createNotification({
          userId: comment.userId,
          type: 'like',
          text: `${liker.displayName} liked your comment`,
          link: `/slide/${comment.slideId}?comment=${comment.id}`,
          fromUser: {
            id: liker.id,
            displayName: liker.displayName,
            avatar: liker.avatar,
          }
        });
      }
    }

    tx.scard(commentLikesKey);
    const results = await tx.exec();
    const likeCount = results[results.length - 1] as number;

    return { newStatus, likeCount };
  },

  async hydrateCommentsWithUserInfo(comments: Comment[]) {
    if (!comments.length) return [];
    const userIds = [...new Set(comments.map(c => c.userId))];
    const pipe = kv!.multi();
    for (const userId of userIds) {
      pipe.get(keys.user(userId));
    }
    const userResults = await pipe.exec() as (User | null)[];
    const usersById = new Map(userResults.filter(Boolean).map(u => [u!.id, u!]));
    return comments.map(comment => ({
      ...comment,
      user: usersById.get(comment.userId) ?? { displayName: 'Unknown User', avatar: '' }
    }));
  },

  // --- Notification Functions ---
  async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    const id = `notif_${crypto.randomUUID()}`;
    const createdAt = Date.now();
    const notification: Notification = {
      id,
      createdAt,
      read: false,
      userId: notificationData.userId,
      type: notificationData.type,
      text: notificationData.text,
      link: notificationData.link,
      fromUser: notificationData.fromUser,
    };

    const tx = kv!.multi();
    tx.set(keys.notification(id), notification);
    tx.zadd(keys.userNotifications(notification.userId), { score: createdAt, member: id });
    await tx.exec();

    return notification;
  },

  async getNotifications(userId: string, options: { start?: number, count?: number } = {}) {
    const { start = 0, count = 20 } = options;
    const notificationIds = await kv!.zrange(keys.userNotifications(userId), start, start + count - 1, { rev: true });
    if (!notificationIds.length) return [];

    const pipe = kv!.multi();
    for (const id of notificationIds) {
      pipe.get(keys.notification(id as string));
    }
    const results = await pipe.exec() as (Notification | null)[];
    return results.filter(Boolean) as Notification[];
  },

  async markNotificationAsRead(notificationId: string): Promise<Notification | null> {
    const notifKey = keys.notification(notificationId);
    const notification = await kv!.get<Notification>(notifKey);
    if (!notification) return null;

    if (notification.read) return notification; // No update needed

    const updatedNotification = { ...notification, read: true };
    await kv!.set(notifKey, updatedNotification);
    return updatedNotification;
  },

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const allNotifications = await this.getNotifications(userId, { count: 100 }); // Check latest 100
    return allNotifications.filter(n => !n.read).length;
  }
};

export type Db = typeof vercelDb;

let db: Db;

if (process.env.MOCK_API === 'true') {
  console.log("Using mock DB.");
  db = mockDb as any;
} else {
  console.log("Using Vercel KV.");
  db = vercelDb;
}

export { db };
export * from './db.interfaces';
