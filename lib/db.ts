import { db as mockDb } from './mock-db';
import * as postgres from './db-postgres';

const postgresDb = {
    ...postgres,
    savePushSubscription: postgres.savePushSubscription,
    getPushSubscriptions: postgres.getPushSubscriptions,
};

export type Db = typeof postgresDb;

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
