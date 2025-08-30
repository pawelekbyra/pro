import { db, User, Video as RenamedVideo, Comment } from '../lib/db'; // Renamed Slide to Video
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// The old data structure from data.json
interface OldSlide {
  id: string;
  likeId: string; // We need this to map old likes
  user: string; // username
  description: string;
  mp4Url: string;
  hlsUrl: string | null;
  poster: string;
  avatar: string;
  access: 'public' | 'secret';
}
interface OldLike {
  slideId: string; // This is the likeId from OldSlide
  userId: string;
}
interface OldComment {
  slideId: string; // This is the slide id
  userId: string;
  text: string;
  createdAt: string;
}
interface OldDbData {
  users: User[];
  slides: OldSlide[];
  likes: OldLike[];
  comments: OldComment[];
}


async function seed() {
  console.log('Starting database seed with new structure...');

  try {
    // 1. Read data from data.json
    const dbPath = path.join(process.cwd(), 'data.json');
    const fileContents = await fs.readFile(dbPath, 'utf8');
    const data = JSON.parse(fileContents) as OldDbData;
    console.log('Read data from data.json successfully.');

    // Clear the database before seeding
    // await kv.flushall(); // Use with caution!
    console.log("Note: Database flushing is disabled. Run 'kv.flushall()' manually if you need a clean slate.");


    // 2. Seed Users
    console.log(`Seeding ${data.users.length} users...`);
    const userMap = new Map<string, User>(); // Map old username to new User object
    for (const userData of data.users) {
      // In the old model, password was pre-hashed. In the new one, we expect to do it.
      // For seeding, let's assume we need to re-hash a placeholder if it's not a real hash.
      // This part is tricky without knowing the source data. We'll assume passwords are plain in `data.json`.
      const passwordHash = await bcrypt.hash(userData.passwordHash, 10);

      const newUser = await db.createUser({ ...userData, passwordHash });
      userMap.set(userData.username, newUser);
      console.log(`- Created user: ${newUser.username}`);
    }

    // 3. Seed Videos (Slides)
    console.log(`Seeding ${data.slides.length} videos...`);
    const slideIdToVideoIdMap = new Map<string, string>(); // Map old slideId to new videoId
    const likeIdToVideoIdMap = new Map<string, string>(); // Map old likeId to new videoId
    for (const slideData of data.slides) {
      const author = userMap.get(slideData.user);
      if (!author) {
        console.warn(`- Skipping slide "${slideData.description}" because author "${slideData.user}" was not found.`);
        continue;
      }
      const newVideo = await db.createVideo({
        userId: author.id,
        username: author.username,
        description: slideData.description,
        mp4Url: slideData.mp4Url,
        hlsUrl: slideData.hlsUrl,
        poster: slideData.poster,
        avatar: author.avatar, // Use author's current avatar
        access: slideData.access,
      });
      slideIdToVideoIdMap.set(slideData.id, newVideo.id);
      likeIdToVideoIdMap.set(slideData.likeId, newVideo.id);
      console.log(`- Created video: ${newVideo.description}`);
    }

    // 4. Seed Likes
    console.log(`Seeding ${data.likes.length} likes...`);
    for (const likeData of data.likes) {
      const videoId = likeIdToVideoIdMap.get(likeData.slideId);
      // Note: The old like data seems to use user ID directly.
      const userId = likeData.userId;
      if (videoId && userId) {
        await db.toggleLike(videoId, userId);
        console.log(`- Added like from user ${userId} to video ${videoId}`);
      }
    }

    // 5. Seed Comments
    console.log(`Seeding ${data.comments.length} comments...`);
    for (const commentData of data.comments) {
      const videoId = slideIdToVideoIdMap.get(commentData.slideId);
      const userId = commentData.userId;
      if (videoId && userId) {
        await db.addComment(videoId, userId, commentData.text);
        console.log(`- Added comment from user ${userId} to video ${videoId}`);
      }
    }

    console.log('Seeding complete! ✅');

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
