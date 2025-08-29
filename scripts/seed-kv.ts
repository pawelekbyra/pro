import { kv } from '../lib/kv';
import { promises as fs } from 'fs';
import path from 'path';
import type { DbData } from '../lib/db';

async function seed() {
  console.log('Starting database seed...');

  try {
    // 1. Read data from data.json
    const dbPath = path.join(process.cwd(), 'data.json');
    const fileContents = await fs.readFile(dbPath, 'utf8');
    const data = JSON.parse(fileContents) as DbData;

    // Ensure all keys are present, providing defaults if necessary
    const requiredKeys: (keyof DbData)[] = ['users', 'slides', 'likes', 'comments'];
    for (const key of requiredKeys) {
      if (!data[key]) {
        (data as any)[key] = [];
      }
    }

    console.log('Read data from data.json successfully.');

    // 2. Write data to Vercel KV
    await Promise.all([
      kv.set('users', data.users),
      kv.set('slides', data.slides),
      kv.set('likes', data.likes),
      kv.set('comments', data.comments),
    ]);

    console.log('Successfully seeded Vercel KV with the following keys: users, slides, likes, comments.');
    console.log(`- ${data.users.length} users`);
    console.log(`- ${data.slides.length} slides`);
    console.log(`- ${data.likes.length} likes`);
    console.log(`- ${data.comments.length} comments`);
    console.log('Seeding complete! ✅');

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
