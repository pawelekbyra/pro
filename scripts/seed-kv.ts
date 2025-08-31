import { db, User } from '../lib/db';
import { VideoSlide } from '../lib/types';
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// This script now expects the new data structure and is simplified.
// It reads from a `data.json` file that should be updated to the new format if used.
interface SeedData {
  users: User[];
  slides: Omit<VideoSlide, 'id' | 'createdAt' | 'initialLikes' | 'isLiked' | 'initialComments'>[];
}

async function seed() {
  console.log('Starting database seed with new grid structure...');

  try {
    const dbPath = path.join(process.cwd(), 'data.json');
    const fileContents = await fs.readFile(dbPath, 'utf8');
    const data = JSON.parse(fileContents) as SeedData;
    console.log('Read data from data.json successfully.');

    console.log("Note: Database flushing is disabled. Run 'await kv.flushall()' manually if you need a clean slate.");

    // 1. Seed Users
    console.log(`Seeding ${data.users.length} users...`);
    for (const userData of data.users) {
      if (!userData.password) {
        console.log(`- Skipping user ${userData.username} due to missing password.`);
        continue;
      }
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await db.createUser({ ...userData, password: hashedPassword });
      console.log(`- Created user: ${userData.username}`);
    }

    // 2. Seed Slides
    console.log(`Seeding ${data.slides.length} slides...`);
    for (const slideData of data.slides) {
       try {
        await db.createSlide(slideData);
        console.log(`- Created slide at (${slideData.x}, ${slideData.y})`);
      } catch (error) {
        console.error(`- Failed to create slide at (${slideData.x}, ${slideData.y}):`, error);
      }
    }

    console.log('Seeding complete! ✅');

  } catch (error) {
    console.error('Error during seeding:', error);
    // This might fail if data.json is not updated, which is fine for now.
    console.log("Seeding script failed. This might be expected if data.json is in the old format. The script itself is now refactored.");
  }
}

seed();
