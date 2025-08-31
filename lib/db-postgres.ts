import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { User, Comment, Notification } from './db.interfaces';
import { Slide } from './types';

let sql: NeonQueryFunction<false, false>;

function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}


// --- Table Creation ---
export async function createTables() {
  const sql = getDb();
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
    const sql = getDb();
    const result = await sql`SELECT * FROM users WHERE id = ${id};`;
    return result[0] as User || null;
}
export async function findUserByEmail(email: string): Promise<User | null> {
    const sql = getDb();
    const result = await sql`SELECT * FROM users WHERE email = ${email};`;
    return result[0] as User || null;
}
export async function getAllUsers(): Promise<User[]> {
    const sql = getDb();
    const result = await sql`SELECT * FROM users;`;
    return result as unknown as User[];
}
export async function createUser(userData: Omit<User, 'id' | 'sessionVersion' | 'password'> & {password: string}): Promise<User> {
    const sql = getDb();
    const { username, displayName, email, password, avatar, user_type } = userData;
    const result = await sql`
        INSERT INTO users (username, "displayName", email, password, avatar, "user_type")
        VALUES (${username}, ${displayName}, ${email}, ${password}, ${avatar}, ${user_type || 'user'})
        RETURNING *;
    `;
    return result[0] as User;
}
export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const sql = getDb();
    const user = await findUserById(userId);
    if (!user) return null;
    const updatedUser = { ...user, ...updates };
    const { id, username, displayName, email, password, avatar, user_type, sessionVersion } = updatedUser;
    const result = await sql`
        UPDATE users
        SET username = ${username}, "displayName" = ${displayName}, email = ${email}, password = ${password}, avatar = ${avatar}, "user_type" = ${user_type}, "sessionVersion" = ${sessionVersion}
        WHERE id = ${id}
        RETURNING *;
    `;
    return result[0] as User || null;
}
export async function deleteUser(userId: string): Promise<boolean> {
    const sql = getDb();
    const result = await sql`DELETE FROM users WHERE id = ${userId} RETURNING id;`;
    return result.length > 0;
}

// --- Slide Functions ---
export async function getSlide(slideId: string): Promise<Slide | null> {
    const sql = getDb();
    const result = await sql`SELECT * FROM slides WHERE id = ${slideId};`;
    if (!result[0]) return null;
    const dbSlide = result[0];
    const { slideType, content, ...rest } = dbSlide;
    const slide = {
        ...rest,
        type: slideType,
        data: JSON.parse(content as string || '{}'),
    } as unknown as Slide;
    return slide;
}
export async function getAllSlides(): Promise<Slide[]> {
    const sql = getDb();
    const result = await sql`SELECT * FROM slides;`;
    return (result as unknown as any[]).map(dbSlide => {
        const { slideType, content, ...rest } = dbSlide;
        return {
            ...rest,
            type: slideType,
            data: JSON.parse(content as string || '{}'),
        };
    }) as Slide[];
}
export async function createSlide(slideData: Omit<Slide, 'id' | 'createdAt' | 'initialLikes' | 'isLiked' | 'initialComments'>): Promise<Slide> {
    const sql = getDb();
    const id = `slide_${crypto.randomUUID()}`;
    const { userId, username, x, y, type, data } = slideData;
    const content = JSON.stringify(data);
    const title = 'title' in data ? (data as any).title : null;

    const result = await sql`
        INSERT INTO slides ("id", "userId", "username", "x", "y", "slideType", "title", "content")
        VALUES (${id}, ${userId}, ${username}, ${x}, ${y}, ${type}, ${title}, ${content})
        RETURNING *;
    `;
    const dbSlide = result[0];
    return {
        ...slideData,
        id: dbSlide.id,
        createdAt: new Date(dbSlide.createdAt).getTime(),
        initialLikes: 0,
        isLiked: false,
        initialComments: 0,
    } as Slide;
}
export async function updateSlide(slideId: string, updates: Partial<Omit<Slide, 'id' | 'createdAt' | 'userId' | 'username' | 'x' | 'y'>>): Promise<Slide | null> {
    const sql = getDb();
    const slide = await getSlide(slideId);
    if (!slide) return null;
    const updatedSlide = { ...slide, ...updates };
    const { data } = updatedSlide;
    const content = JSON.stringify(data);
    const title = 'title' in data ? (data as any).title : null;

    const result = await sql`
        UPDATE slides SET title = ${title}, content = ${content} WHERE id = ${slideId} RETURNING *;
    `;
    return result[0] as Slide || null;
}
export async function deleteSlide(slideId: string): Promise<boolean> {
    const sql = getDb();
    const result = await sql`DELETE FROM slides WHERE id = ${slideId} RETURNING id;`;
    return result.length > 0;
}
export async function getSlidesInView(options: { x: number, y: number, width: number, height: number, currentUserId?: string }): Promise<Slide[]> {
    const sql = getDb();
    const { x, y, width, height, currentUserId } = options;
    const results = await sql`
        SELECT s.*,
            (SELECT COUNT(*) FROM likes l WHERE l."slideId" = s.id) as "initialLikes",
            (SELECT COUNT(*) FROM comments c WHERE c."slideId" = s.id) as "initialComments",
            (SELECT EXISTS(SELECT 1 FROM likes l WHERE l."slideId" = s.id AND l."userId" = ${currentUserId || null})) as "isLiked"
        FROM slides s
        WHERE s.x >= ${x} AND s.x < ${x + width} AND s.y >= ${y} AND s.y < ${y + height};
    `;
    return (results as unknown as any[]).map(dbSlide => {
        const { slideType, content, ...rest } = dbSlide;
        return {
            ...rest,
            type: slideType,
            data: JSON.parse(content as string || '{}'),
        };
    }) as Slide[];
}

// --- Like Functions ---
export async function toggleLike(slideId: string, userId: string): Promise<{ newStatus: 'liked' | 'unliked', likeCount: number }> {
    const sql = getDb();
    const isLikedResult = await sql`SELECT 1 FROM likes WHERE "slideId" = ${slideId} AND "userId" = ${userId};`;
    const isLiked = isLikedResult.length > 0;
    if (isLiked) {
        await sql`DELETE FROM likes WHERE "slideId" = ${slideId} AND "userId" = ${userId};`;
    } else {
        await sql`INSERT INTO likes ("slideId", "userId") VALUES (${slideId}, ${userId});`;
    }
    const likeCountResult = await sql`SELECT COUNT(*) as count FROM likes WHERE "slideId" = ${slideId};`;
    const likeCount = likeCountResult[0].count as number;
    return { newStatus: isLiked ? 'unliked' : 'liked', likeCount };
}

// --- Comment Functions ---
export async function getComments(slideId: string): Promise<Comment[]> {
    const sql = getDb();
    const result = await sql`
        SELECT c.*, u.username, u."displayName", u.avatar FROM comments c
        JOIN users u ON c."userId" = u.id
        WHERE "slideId" = ${slideId} ORDER BY "createdAt" DESC;
    `;
    return (result as unknown as any[]).map(c => ({ ...c, user: { displayName: c.displayName, avatar: c.avatar } }));
}
export async function addComment(slideId: string, userId: string, text: string): Promise<Comment> {
    const sql = getDb();
    const result = await sql`
        INSERT INTO comments ("slideId", "userId", text) VALUES (${slideId}, ${userId}, ${text}) RETURNING *;
    `;
    const newComment = result[0] as Comment;
    const userResult = await sql`SELECT "displayName", "username", "avatar" FROM users WHERE id = ${userId}`;
    const user = userResult[0] as User;
    return { ...newComment, user: { displayName: user.displayName || user.username, avatar: user.avatar || '' } };
}

// --- Notification Functions ---
export async function createNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    const sql = getDb();
    const { userId, type, text, link, fromUser } = notificationData;
    const fromUserId = fromUser?.id;
    const result = await sql`
        INSERT INTO notifications ("userId", type, text, link, "fromUserId")
        VALUES (${userId}, ${type}, ${text}, ${link}, ${fromUserId})
        RETURNING *;
    `;
    return result[0] as Notification;
}
export async function getNotifications(userId: string): Promise<Notification[]> {
    const sql = getDb();
    const results = await sql`SELECT * FROM notifications WHERE "userId" = ${userId} ORDER BY "createdAt" DESC;`;
    return results as unknown as Notification[];
}
export async function markNotificationAsRead(notificationId: string): Promise<Notification | null> {
    const sql = getDb();
    const result = await sql`UPDATE notifications SET read = true WHERE id = ${notificationId} RETURNING *;`;
    return result[0] as Notification || null;
}
export async function getUnreadNotificationCount(userId: string): Promise<number> {
    const sql = getDb();
    const result = await sql`SELECT COUNT(*) as count FROM notifications WHERE "userId" = ${userId} AND read = false;`;
    return parseInt(result[0].count as string, 10);
}

// --- Push Subscription Functions ---
export async function savePushSubscription(userId: string, subscription: object): Promise<void> {
    const sql = getDb();
    await sql`
        INSERT INTO push_subscriptions ("userId", subscription)
        VALUES (${userId}, ${JSON.stringify(subscription)})
        ON CONFLICT ("userId") DO UPDATE
        SET subscription = ${JSON.stringify(subscription)};
    `;
}

export async function getPushSubscriptions(options: { userId?: string, userType?: string }): Promise<any[]> {
    const sql = getDb();
    const { userId, userType } = options;
    if (userId) {
        return sql`
            SELECT subscription FROM push_subscriptions WHERE "userId" = ${userId};
        `;
    }
    if (userType) {
        return sql`
            SELECT ps.subscription FROM push_subscriptions ps
            JOIN users u ON ps."userId" = u.id
            WHERE u.user_type = ${userType};
        `;
    }
    return [];
}
