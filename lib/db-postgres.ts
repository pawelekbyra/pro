import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { User, Comment, Notification } from './db.interfaces';
import { Slide } from './types';

let sql: NeonQueryFunction<false, false>;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;
const QUERY_TIMEOUT_MS = 5000; // 5 seconds

async function queryWithTimeout(query: Promise<any>) {
  return Promise.race([
    query,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timed out')), QUERY_TIMEOUT_MS)
    ),
  ]);
}

async function executeWithRetry(queryFn: () => Promise<any>) {
  let lastError: Error | undefined;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await queryWithTimeout(queryFn());
    } catch (error: any) {
      lastError = error;
      if (error.message === 'Query timed out' || error.name === 'NeonDbError') {
        console.warn(`Query failed (attempt ${i + 1}/${MAX_RETRIES}): ${error.message}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, i)));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Query failed after ${MAX_RETRIES} retries: ${lastError?.message}`);
}

function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    sql = neon(process.env.DATABASE_URL);
  }

  // Wrap the sql function to include retry logic
  const wrappedSql: any = (strings: TemplateStringsArray, ...values: any[]) => {
    return executeWithRetry(() => sql(strings, ...values));
  }

  // Copy properties from the original sql function, like `sql.query`
  Object.assign(wrappedSql, {
    query: (query: string, params: any[]) => {
      return executeWithRetry(() => sql.query(query, params));
    }
  });

  return wrappedSql as NeonQueryFunction<false, false> & { query: (query: string, params: any[]) => Promise<any> };
}


// --- Table Creation ---
export async function createTables() {
  const sql = getDb();
  await sql`DROP TABLE IF EXISTS password_reset_tokens CASCADE;`;
  await sql`DROP TABLE IF EXISTS push_subscriptions CASCADE;`;
  await sql`DROP TABLE IF EXISTS notifications CASCADE;`;
  await sql`DROP TABLE IF EXISTS comment_likes CASCADE;`;
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
      password VARCHAR(255),
      avatar VARCHAR(255),
      "role" VARCHAR(50) DEFAULT 'user',
      "sessionVersion" INTEGER DEFAULT 1
    );
  `;
  await sql`
    CREATE TABLE password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL
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
        "parentId" VARCHAR(255) REFERENCES comments(id) DEFAULT NULL,
        text TEXT NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await sql`
      CREATE TABLE comment_likes (
          "commentId" VARCHAR(255) REFERENCES comments(id),
          "userId" UUID REFERENCES users(id),
          PRIMARY KEY ("commentId", "userId")
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
        subscription JSONB NOT NULL,
        is_pwa_installed BOOLEAN DEFAULT FALSE
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
export async function createUser(userData: Omit<User, 'id' | 'sessionVersion' | 'password'> & {password: string | null}): Promise<User> {
    const sql = getDb();
    const { username, displayName, email, password, avatar, role } = userData;
    const result = await sql`
        INSERT INTO users (username, "displayName", email, password, avatar, "role")
        VALUES (${username}, ${displayName}, ${email}, ${password}, ${avatar}, ${role || 'user'})
        RETURNING *;
    `;
    return result[0] as User;
}
export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const sql = getDb();

    const keys = Object.keys(updates).filter(key => (updates as any)[key] !== undefined);
    if (keys.length === 0) {
        // No updates provided, just return the user
        return findUserById(userId);
    }

    // Dynamically build the SET clause
    const setClauses = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
    const values = keys.map(key => (updates as any)[key]);

    // Add the userId to the values array for the WHERE clause
    values.push(userId);
    const whereClauseIndex = values.length;

    const query = `
        UPDATE users
        SET ${setClauses}
        WHERE id = $${whereClauseIndex}
        RETURNING *;
    `;

    const result = await sql.query(query, values);

    return (result[0] as User) || null;
}
export async function deleteUser(userId: string): Promise<boolean> {
    const sql = getDb();
    const result = await sql`DELETE FROM users WHERE id = ${userId} RETURNING id;`;
    return result.length > 0;
}

// --- Password Reset Token Functions ---
export async function createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    const sql = getDb();
    await sql`
        INSERT INTO password_reset_tokens ("userId", token, "expiresAt")
        VALUES (${userId}, ${token}, ${expiresAt.toISOString()});
    `;
}

export async function getPasswordResetToken(token: string): Promise<{ id: string, userId: string, expiresAt: Date } | null> {
    const sql = getDb();
    const result = await sql`SELECT * FROM password_reset_tokens WHERE token = ${token};`;
    if (result.length === 0) {
        return null;
    }
    const dbToken = result[0];
    return {
        id: dbToken.id as string,
        userId: dbToken.userId as string,
        expiresAt: new Date(dbToken.expiresAt as string),
    };
}

export async function deletePasswordResetToken(id: string): Promise<void> {
    const sql = getDb();
    await sql`DELETE FROM password_reset_tokens WHERE id = ${id};`;
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
    const title = data && 'title' in data ? (data as any).title : null;

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
    const title = data && 'title' in data ? (data as any).title : null;

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
export async function getSlides(options: { limit?: number, cursor?: string, currentUserId?: string }): Promise<Slide[]> {
    const sql = getDb();
    const { limit = 10, cursor, currentUserId } = options;

    // The cursor is a timestamp. We fetch slides created before the cursor.
    const cursorDate = cursor ? new Date(parseInt(cursor, 10)) : null;

    // We need to build the query dynamically to include the WHERE clause for the cursor.
    let query = `
        SELECT
            s.*,
            COUNT(DISTINCT l."userId")::int AS "initialLikes",
            COUNT(DISTINCT c.id)::int AS "initialComments",
            COALESCE(bool_or(l."userId" = $2), false) AS "isLiked"
        FROM slides s
        LEFT JOIN likes l ON s.id = l."slideId"
        LEFT JOIN comments c ON s.id = c."slideId"
    `;
    const params: any[] = [limit];

    if (cursorDate) {
        query += ` WHERE s."createdAt" < $3`;
        params.push(cursorDate);
    }

    params.push(currentUserId || null);
    // The user id is at a different index depending on whether the cursor is present.
    const userIndex = params.length;
    query = query.replace('$2', `$${userIndex}`);


    query += `
        GROUP BY s.id
        ORDER BY s."createdAt" DESC
        LIMIT $1;
    `;

    const results = await sql.query(query, params);

    return (results as unknown as any[]).map(dbSlide => {
        const { slideType, content, createdAt, ...rest } = dbSlide;
        return {
            ...rest,
            type: slideType,
            createdAt: new Date(createdAt).getTime(),
            data: JSON.parse(content as string || '{}'),
        };
    }) as Slide[];
}

export async function getSlidesInView(options: { x: number, y: number, width: number, height: number, currentUserId?: string, metadataOnly?: boolean }): Promise<Slide[]> {
    const sql = getDb();
    const { x, y, width, height, currentUserId, metadataOnly } = options;

    const selectedColumns = metadataOnly
        ? `s.id, s."userId", s.username, s.x, s.y, s."slideType", s.title, s."createdAt"`
        : "s.*";

    const query = `
        SELECT ${selectedColumns},
            COUNT(DISTINCT l."userId")::int AS "initialLikes",
            COUNT(DISTINCT c.id)::int AS "initialComments",
            COALESCE(bool_or(l."userId" = $5), false) AS "isLiked"
        FROM slides s
        LEFT JOIN likes l ON s.id = l."slideId"
        LEFT JOIN comments c ON s.id = c."slideId"
        WHERE s.x >= $1 AND s.x < $2 AND s.y >= $3 AND s.y < $4
        GROUP BY s.id;
    `;

    const results = await sql.query(query, [x, x + width, y, y + height, currentUserId || null]);

    return (results as unknown as any[]).map(dbSlide => {
        const { slideType, content, ...rest } = dbSlide;
        return {
            ...rest,
            type: slideType,
            data: metadataOnly ? undefined : JSON.parse(content as string || '{}'),
        };
    }) as Slide[];
}

export async function pingDb() {
  const sql = getDb();
  await sql`SELECT 1`;
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

export async function toggleCommentLike(commentId: string, userId: string): Promise<{ newStatus: 'liked' | 'unliked', likeCount: number }> {
    const sql = getDb();
    const isLikedResult = await sql`SELECT 1 FROM comment_likes WHERE "commentId" = ${commentId} AND "userId" = ${userId};`;
    const isLiked = isLikedResult.length > 0;
    if (isLiked) {
        await sql`DELETE FROM comment_likes WHERE "commentId" = ${commentId} AND "userId" = ${userId};`;
    } else {
        await sql`INSERT INTO comment_likes ("commentId", "userId") VALUES (${commentId}, ${userId});`;
    }
    const likeCountResult = await sql`SELECT COUNT(*) as count FROM comment_likes WHERE "commentId" = ${commentId};`;
    const likeCount = likeCountResult[0].count as number;
    return { newStatus: isLiked ? 'unliked' : 'liked', likeCount };
}

// --- Comment Functions ---
export async function getComments(slideId: string): Promise<Comment[]> {
    const sql = getDb();
    // This query needs to be recursive to fetch replies.
    // For now, it fetches all comments and they can be nested on the client.
    const result = await sql`
        SELECT c.*, u.username, u."displayName", u.avatar FROM comments c
        JOIN users u ON c."userId" = u.id
        WHERE "slideId" = ${slideId} ORDER BY "createdAt" DESC;
    `;
    return (result as unknown as any[]).map(c => ({ ...c, user: { displayName: c.displayName, avatar: c.avatar } }));
}

export async function addComment(slideId: string, userId:string, text: string, parentId: string | null = null): Promise<Comment> {
    const sql = getDb();
    const result = await sql`
        WITH new_comment AS (
            INSERT INTO comments (id, "slideId", "userId", text, "parentId")
            VALUES ('comment_' || gen_random_uuid()::text, ${slideId}, ${userId}, ${text}, ${parentId})
            RETURNING *
        )
        SELECT c.*, u."displayName", u.username, u.avatar
        FROM new_comment c
        JOIN users u ON c."userId" = u.id;
    `;
    const newCommentData = result[0];
    const { displayName, username, avatar, ...commentData } = newCommentData;
    return {
        ...commentData,
        user: {
            displayName: displayName || username,
            avatar: avatar || ''
        }
    } as Comment;
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
    const results = await sql`
        SELECT n.*, u.username as "fromUsername", u.avatar as "fromUserAvatar"
        FROM notifications n
        LEFT JOIN users u ON n."fromUserId" = u.id
        WHERE n."userId" = ${userId}
        ORDER BY n."createdAt" DESC;
    `;
    return (results as unknown as any[]).map(n => {
        const { fromUsername, fromUserAvatar, ...rest } = n;
        return {
            ...rest,
            fromUser: n.fromUserId ? {
                id: n.fromUserId,
                username: fromUsername,
                avatar: fromUserAvatar,
            } : undefined,
        };
    }) as Notification[];
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
export async function savePushSubscription(userId: string, subscription: object, isPwaInstalled: boolean): Promise<void> {
    const sql = getDb();
    await sql`
        INSERT INTO push_subscriptions ("userId", subscription, is_pwa_installed)
        VALUES (${userId}, ${JSON.stringify(subscription)}, ${isPwaInstalled})
        ON CONFLICT ("userId") DO UPDATE
        SET subscription = EXCLUDED.subscription, is_pwa_installed = EXCLUDED.is_pwa_installed;
    `;
}

export async function getPushSubscriptions(options: { userId?: string, role?: string, isPwaInstalled?: boolean }): Promise<any[]> {
    const sql = getDb();
    const { userId, role, isPwaInstalled } = options;

    if (userId) {
        return await sql`SELECT ps.subscription FROM push_subscriptions ps WHERE ps."userId" = ${userId}`;
    }

    if (role) {
        return await sql`
            SELECT ps.subscription FROM push_subscriptions ps
            JOIN users u ON ps."userId" = u.id
            WHERE u.role = ${role}`;
    }

    if (isPwaInstalled !== undefined) {
        return await sql`
            SELECT ps.subscription FROM push_subscriptions ps
            WHERE ps.is_pwa_installed = ${isPwaInstalled}`;
    }

    // This case is for when options is empty, meaning get all subscriptions.
    return await sql`SELECT ps.subscription FROM push_subscriptions ps`;
}
