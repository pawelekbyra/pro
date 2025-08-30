import { kv } from './kv';

// --- Key Generation Functions ---
export const keys = {
  user: (userId: string) => `user:${userId}`,
  emailToId: (email: string) => `email_to_id:${email.toLowerCase()}`,
  usernameToId: (username: string) => `username_to_id:${username.toLowerCase()}`,
  userLikes: (userId: string) => `user_likes:${userId}`, // Set of slide IDs

  video: (videoId: string) => `video:${videoId}`,
  videoLikes: (videoId: string) => `video_likes:${videoId}`, // Set of user IDs
  videoComments: (videoId: string) => `video_comments:${videoId}`, // List of comment IDs

  allVideos: () => 'all_videos', // Sorted Set of video IDs by timestamp

  comment: (commentId: string) => `comment:${commentId}`,
};

// --- Type Definitions ---
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

// Renamed from Slide for clarity
export interface Video {
  id: string;
  userId: string; // Author's ID
  username: string; // Author's username
  description: string;
  mp4Url: string;
  hlsUrl: string | null;
  poster: string;
  avatar: string; // Author's avatar at the time of posting
  access: 'public' | 'secret';
  createdAt: number; // Unix timestamp
  autoPlay?: boolean;
  loopVideo?: boolean;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  text: string;
  createdAt: number; // Unix timestamp
  likedBy: string[]; // Array of userIds
}

// Note: The 'Like' interface is removed as we'll use Redis Sets directly.
// Note: The 'DbData' interface is removed as it represents the old data model.


// --- Public API for Database Operations (Refactored for Vercel KV) ---

export const db = {
  // --- User Functions ---
  async findUserByEmail(email: string): Promise<User | undefined> {
    const userId = await kv.get<string>(keys.emailToId(email));
    if (!userId) {
      return undefined;
    }
    return this.findUserById(userId);
  },

  async findUserById(id: string): Promise<User | undefined> {
    const user = await kv.get<User>(keys.user(id));
    return user ?? undefined;
  },

  async getAllUsers(): Promise<User[]> {
    const userKeys = await kv.keys('user:*');
    if (!userKeys.length) {
      return [];
    }
    const users = await kv.mget<User[]>(...userKeys);
    return users.filter(Boolean) as User[];
  },

  async createUser(userData: Omit<User, 'id' | 'sessionVersion'>): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = {
      ...userData,
      id,
      sessionVersion: 1,
    };

    const tx = kv.multi();
    tx.set(keys.user(id), user);
    tx.set(keys.emailToId(user.email), id);
    tx.set(keys.usernameToId(user.username), id);
    await tx.exec();

    return user;
  },

  async isEmailInUse(email: string, excludeUserId?: string): Promise<boolean> {
    const userId = await kv.get<string>(keys.emailToId(email));
    return userId ? userId !== excludeUserId : false;
  },

  async isUsernameInUse(username: string, excludeUserId?: string): Promise<boolean> {
    const userId = await kv.get<string>(keys.usernameToId(username));
    return userId ? userId !== excludeUserId : false;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = await this.findUserById(userId);
    if (!user) {
      return null;
    }

    // Prevent critical fields from being updated directly
    delete updates.id;
    delete updates.passwordHash;
    delete updates.email; // Email changes should have a dedicated process
    delete updates.username; // Username changes should have a dedicated process

    const updatedUser = { ...user, ...updates };
    await kv.set(keys.user(userId), updatedUser);
    return updatedUser;
  },

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    if (!user) {
      return false;
    }
    user.passwordHash = newPasswordHash;
    await kv.set(keys.user(userId), user);
    return true;
  },

  async deleteUser(userId: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    if (!user) {
      return false;
    }

    // This is a simplified deletion. In a real app, you'd also have to
    // handle content created by the user (videos, comments, etc.)
    const tx = kv.multi();
    tx.del(keys.user(userId));
    tx.del(keys.emailToId(user.email));
    tx.del(keys.usernameToId(user.username));
    await tx.exec();

    return true;
  },

  async incrementSessionVersion(userId: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    if (!user) {
      return false;
    }
    user.sessionVersion = (user.sessionVersion || 1) + 1;
    await kv.set(keys.user(userId), user);
    return true;
  },

  // --- Video Functions ---

  async getVideos(options: { currentUserId?: string, start?: number, count?: number } = {}) {
    const { currentUserId, start = 0, count = 10 } = options;

    // 1. Fetch a page of video IDs from the sorted set
    const videoIds = await kv.zrange(keys.allVideos(), start, start + count - 1, { rev: true });

    if (!videoIds.length) {
      return [];
    }

    // 2. Create a pipeline to fetch all video data and their like counts
    const pipe = kv.multi();
    for (const id of videoIds) {
      pipe.get(keys.video(id as string));
      pipe.scard(keys.videoLikes(id as string));
    }
    // If a user is logged in, check which videos they have liked
    if (currentUserId) {
      const userLikesKey = keys.userLikes(currentUserId);
      pipe.sismember(userLikesKey, videoIds);
    }

    const results = await pipe.exec();

    // 3. Process the results
    const videos = [];
    const userLikes = currentUserId ? (results.pop() as number[]).map(Boolean) : [];

    for (let i = 0; i < videoIds.length; i++) {
      const videoData = results[i * 2] as Video | null;
      if (!videoData) continue; // Skip if video data is missing for some reason

      const likeCount = results[i * 2 + 1] as number;

      videos.push({
        ...videoData,
        initialLikes: likeCount,
        isLiked: currentUserId ? userLikes[i] : false,
        initialComments: 0, // This can be hydrated separately if needed
      });
    }

    return videos;
  },

  async createVideo(videoData: Omit<Video, 'id' | 'createdAt'>): Promise<Video> {
    const id = `video_${crypto.randomUUID()}`;
    const createdAt = Date.now();
    const newVideo: Video = {
      ...videoData,
      id,
      createdAt,
    };

    const tx = kv.multi();
    tx.set(keys.video(id), newVideo);
    tx.zadd(keys.allVideos(), { score: createdAt, member: id });
    await tx.exec();

    return newVideo;
  },

  async updateVideo(videoId: string, updates: Partial<Omit<Video, 'id' | 'createdAt' | 'userId' | 'username'>>): Promise<Video | null> {
    const video = await kv.get<Video>(keys.video(videoId));
    if (!video) {
      return null;
    }
    const updatedVideo = { ...video, ...updates };
    await kv.set(keys.video(videoId), updatedVideo);
    return updatedVideo;
  },

  async deleteVideo(videoId: string): Promise<boolean> {
    const video = await kv.get<Video>(keys.video(videoId));
    if (!video) {
      return false;
    }

    const tx = kv.multi();
    tx.del(keys.video(videoId)); // Delete video object
    tx.del(keys.videoLikes(videoId)); // Delete likes set
    tx.del(keys.videoComments(videoId)); // Delete comments list
    tx.zrem(keys.allVideos(), videoId); // Remove from sorted set
    // Note: We are not deleting individual comment objects here, which might be desired
    await tx.exec();

    return true;
  },

  async toggleLike(videoId: string, userId: string): Promise<{ newStatus: 'liked' | 'unliked', likeCount: number }> {
    const videoLikesKey = keys.videoLikes(videoId);
    const userLikesKey = keys.userLikes(userId);

    const isLiked = await kv.sismember(videoLikesKey, userId);

    const tx = kv.multi();
    if (isLiked) {
      // User is unliking the video
      tx.srem(videoLikesKey, userId);
      tx.srem(userLikesKey, videoId);
    } else {
      // User is liking the video
      tx.sadd(videoLikesKey, userId);
      tx.sadd(userLikesKey, videoId);
    }
    await tx.exec();

    const likeCount = await kv.scard(videoLikesKey);

    return { newStatus: isLiked ? 'unliked' : 'liked', likeCount };
  },

  // --- Comment Functions ---
  async getComments(videoId: string, options: { start?: number, count?: number } = {}) {
    const { start = 0, count = 20 } = options;
    const commentIds = await kv.lrange(keys.videoComments(videoId), start, start + count - 1);

    if (!commentIds.length) {
      return [];
    }

    const pipe = kv.multi();
    for (const id of commentIds) {
      pipe.get(keys.comment(id as string));
    }
    const results = await pipe.exec() as (Comment | null)[];

    const comments = results.filter(Boolean) as Comment[];

    // In a real app, you'd probably want to fetch user info here as well
    // For now, we return comments and the client can fetch user info if needed
    // or we can do a second-level hydration.
    const hydratedComments = await this.hydrateCommentsWithUserInfo(comments);
    return hydratedComments;
  },

  async addComment(videoId: string, userId: string, text: string) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found to add comment.');
    }

    const commentId = `comment_${crypto.randomUUID()}`;
    const newComment: Comment = {
      id: commentId,
      videoId,
      userId,
      text,
      createdAt: Date.now(),
      likedBy: [], // This feature might need its own refactor
    };

    const tx = kv.multi();
    tx.set(keys.comment(commentId), newComment);
    tx.lpush(keys.videoComments(videoId), commentId);
    await tx.exec();

    // Return the comment hydrated with user info
    return {
      ...newComment,
      user: {
        displayName: user.displayName,
        avatar: user.avatar,
      }
    };
  },

  async hydrateCommentsWithUserInfo(comments: Comment[]) {
    if (!comments.length) {
      return [];
    }
    const userIds = [...new Set(comments.map(c => c.userId))];
    const pipe = kv.multi();
    for (const userId of userIds) {
      pipe.get(keys.user(userId));
    }
    const userResults = await pipe.exec() as (User | null)[];
    const usersById = new Map(userResults.filter(Boolean).map(u => [u!.id, u]));

    return comments.map(comment => ({
      ...comment,
      user: usersById.get(comment.userId) ?? { displayName: 'Unknown User', avatar: '' }
    }));
  }
};
