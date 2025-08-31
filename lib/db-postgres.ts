import { neon } from '@neondatabase/serverless';
import { User, Comment, Notification } from './db.interfaces';
import { Slide } from './types';

export const sql = neon(process.env.DATABASE_URL!);

// --- Table Creation ---
export async function createTables() {
  await sql`DROP TABLE IF EXISTS push_subscriptions CASCADE;`;
  await sql`DROP TABLE IF EXISTS notifications CASCADE;`;
  await sql`DROP TABLE IF EXISTS likes CASCADE;`;
  await sql`DROP TABLE IF EXISTS comments CASCADE;`;
  await sql`DROP TABLE IF EXISTS slides CASCADE;`;
  await sql`DROP TABLE IF EXISTS users CASCADE;`;

  await sql`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(255) UNIQUE NOT NULL,
      "displayName" VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      avatar VARCHAR(255),
      "user_type" VARCHAR(50) DEFAULT 'user',
      "sessionVersion" INTEGER DEFAULT 1
    );
  `;
  await sql`
    CREATE TABLE slides (
        id VARCHAR(255) PRIMARY KEY,
        "userId" UUID REFERENCES users(id),
        username VARCHAR(255) NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        "slideType" VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        content TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(x, y)
    );
  `;
  await sql`
    CREATE TABLE comments (
        id VARCHAR(255) PRIMARY KEY,
        "slideId" VARCHAR(255) REFERENCES slides(id),
        "userId" UUID REFERENCES users(id),
        text TEXT NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`
    CREATE TABLE likes (
        "slideId" VARCHAR(255) REFERENCES slides(id),
        "userId" UUID REFERENCES users(id),
        PRIMARY KEY ("slideId", "userId")
    );
  `;
  await sql`
    CREATE TABLE notifications (
        id VARCHAR(255) PRIMARY KEY,
        "userId" UUID REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        link VARCHAR(255),
        "fromUserId" UUID REFERENCES users(id),
        read BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`
    CREATE TABLE push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id) UNIQUE,
        subscription JSONB NOT NULL
    );
  `;
}

// --- User Functions ---
export async function findUserById(id: string): Promise<User | null> {
    const result = await sql<User[]>`SELECT * FROM users WHERE id = ${id};`;
    return result[0] || null;
}
export async function findUserByEmail(email: string): Promise<User | null> {
    const result = await sql<User[]>`SELECT * FROM users WHERE email = ${email};`;
    return result[0] || null;
}
export async function getAllUsers(): Promise<User[]> {
    return sql<User[]>`SELECT * FROM users;`;
}
export async function createUser(userData: Omit<User, 'id' | 'sessionVersion' | 'password'> & {password: string}): Promise<User> {
    const { username, displayName, email, password, avatar, user_type } = userData;
    const result = await sql<User[]>`
        INSERT INTO users (username, "displayName", email, password, avatar, "user_type")
        VALUES (${username}, ${displayName}, ${email}, ${password}, ${avatar}, ${user_type || 'user'})
        RETURNING *;
    `;
    return result[0];
}
export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = await findUserById(userId);
    if (!user) return null;
    const updatedUser = { ...user, ...updates };
    const { id, username, displayName, email, password, avatar, user_type, sessionVersion } = updatedUser;
    const result = await sql<User[]>`
        UPDATE users
        SET username = ${username}, "displayName" = ${displayName}, email = ${email}, password = ${password}, avatar = ${avatar}, "user_type" = ${user_type}, "sessionVersion" = ${sessionVersion}
        WHERE id = ${id}
        RETURNING *;
    `;
    return result[0] || null;
}
export async function deleteUser(userId: string): Promise<boolean> {
    const result = await sql`DELETE FROM users WHERE id = ${userId};`;
    return result.rowCount > 0;
}

// --- Slide Functions ---
export async function getSlide(slideId: string): Promise<Slide | null> {
    const result = await sql<Slide[]>`SELECT * FROM slides WHERE id = ${slideId};`;
    return result[0] || null;
}
export async function getAllSlides(): Promise<Slide[]> {
    return sql<Slide[]>`SELECT * FROM slides;`;
}
export async function createSlide(slideData: Omit<Slide, 'id' | 'createdAt' | 'initialLikes' | 'isLiked' | 'initialComments'>): Promise<Slide> {
    const id = `slide_${crypto.randomUUID()}`;
    const { userId, username, x, y, slideType, title, content } = slideData;
    const result = await sql<Slide[]>`
        INSERT INTO slides ("id", "userId", "username", "x", "y", "slideType", "title", "content")
        VALUES (${id}, ${userId}, ${username}, ${x}, ${y}, ${slideType}, ${title}, ${content})
        RETURNING *;
    `;
    return result[0];
}
export async function updateSlide(slideId: string, updates: Partial<Omit<Slide, 'id' | 'createdAt' | 'userId' | 'username' | 'x' | 'y'>>): Promise<Slide | null> {
    const slide = await getSlide(slideId);
    if (!slide) return null;
    const updatedSlide = { ...slide, ...updates };
    const { title, content } = updatedSlide;
    const result = await sql<Slide[]>`
        UPDATE slides SET title = ${title}, content = ${content} WHERE id = ${slideId} RETURNING *;
    `;
    return result[0] || null;
}
export async function deleteSlide(slideId: string): Promise<boolean> {
    const result = await sql`DELETE FROM slides WHERE id = ${slideId};`;
    return result.rowCount > 0;
}
export async function getSlidesInView(options: { x: number, y: number, width: number, height: number, currentUserId?: string }): Promise<Slide[]> {
    const { x, y, width, height, currentUserId } = options;
    return sql<Slide[]>`
        SELECT s.*,
            (SELECT COUNT(*) FROM likes l WHERE l."slideId" = s.id) as "initialLikes",
            (SELECT COUNT(*) FROM comments c WHERE c."slideId" = s.id) as "initialComments",
            (SELECT EXISTS(SELECT 1 FROM likes l WHERE l."slideId" = s.id AND l."userId" = ${currentUserId || null})) as "isLiked"
        FROM slides s
        WHERE s.x >= ${x} AND s.x < ${x + width} AND s.y >= ${y} AND s.y < ${y + height};
    `;
}

// --- Like Functions ---
export async function toggleLike(slideId: string, userId: string): Promise<{ newStatus: 'liked' | 'unliked', likeCount: number }> {
    const isLikedResult = await sql`SELECT 1 FROM likes WHERE "slideId" = ${slideId} AND "userId" = ${userId};`;
    const isLiked = isLikedResult.length > 0;
    if (isLiked) {
        await sql`DELETE FROM likes WHERE "slideId" = ${slideId} AND "userId" = ${userId};`;
    } else {
        await sql`INSERT INTO likes ("slideId", "userId") VALUES (${slideId}, ${userId});`;
    }
    const likeCountResult = await sql`SELECT COUNT(*) FROM likes WHERE "slideId" = ${slideId};`;
    const likeCount = likeCountResult[0].count;
    return { newStatus: isLiked ? 'unliked' : 'liked', likeCount };
}

// --- Comment Functions ---
export async function getComments(slideId: string): Promise<Comment[]> {
    const result = await sql<Comment[]>`
        SELECT c.*, u.username, u."displayName", u.avatar FROM comments c
        JOIN users u ON c."userId" = u.id
        WHERE "slideId" = ${slideId} ORDER BY "createdAt" DESC;
    `;
    return result.map(c => ({ ...c, user: { displayName: c.displayName, avatar: c.avatar } }));
}
export async function addComment(slideId: string, userId: string, text: string): Promise<Comment> {
    const result = await sql<Comment[]>`
        INSERT INTO comments ("slideId", "userId", text) VALUES (${slideId}, ${userId}, ${text}) RETURNING *;
    `;
    const newComment = result[0];
    const userResult = await sql<User[]>`SELECT "displayName", avatar FROM users WHERE id = ${userId}`;
    const user = userResult[0];
    return { ...newComment, user: { displayName: user.displayName, avatar: user.avatar } };
}

// --- Notification Functions ---
export async function createNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    const { userId, type, text, link, fromUserId } = notificationData;
    const result = await sql<Notification[]>`
        INSERT INTO notifications ("userId", type, text, link, "fromUserId")
        VALUES (${userId}, ${type}, ${text}, ${link}, ${fromUserId})
        RETURNING *;
    `;
    return result[0];
}
export async function getNotifications(userId: string): Promise<Notification[]> {
    return sql<Notification[]>`SELECT * FROM notifications WHERE "userId" = ${userId} ORDER BY "createdAt" DESC;`;
}
export async function markNotificationAsRead(notificationId: string): Promise<Notification | null> {
    const result = await sql<Notification[]>`UPDATE notifications SET read = true WHERE id = ${notificationId} RETURNING *;`;
    return result[0] || null;
}
export async function getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await sql<{ count: string }[]>`SELECT COUNT(*) FROM notifications WHERE "userId" = ${userId} AND read = false;`;
    return parseInt(result[0].count, 10);
}
