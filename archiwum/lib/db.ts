import { db as mockDb } from './mock-db';
import * as postgres from './db-postgres';
import { Slide } from './types';

const postgresDb = {
    ...postgres,
    savePushSubscription: postgres.savePushSubscription,
    getPushSubscriptions: postgres.getPushSubscriptions,
};

export type Db = typeof postgresDb & {
    getAllColumnCoords?: () => Promise<{ x: number }[]>;
    getSlidesInColumn?: (
        columnIndex: number,
        options: { offset?: number; limit?: number; currentUserId?: string }
    ) => Promise<Slide[]>;
    getSlides?: (options: { limit?: number, cursor?: string, currentUserId?: string }) => Promise<Slide[]>;
};

let db: Db;

if (process.env.MOCK_API === 'true') {
  console.log("Using mock DB.");
  db = mockDb as any;
} else {
  console.log("Using Vercel Postgres.");
  db = postgresDb;
}

export { db };
export * from './db.interfaces';
