import { createTables } from '../lib/db-postgres';
import { db } from '../lib/db';
import { User } from '@/lib/db.interfaces';

const DANGEROUS_WARNING = `
/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\
/!\\                                                             /!\\
/!\\  DANGER: THIS SCRIPT WILL DELETE ALL DATA IN THE DATABASE!  /!\\
/!\\                                                             /!\\
/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\/!\\
`;

async function main() {
  console.log(DANGEROUS_WARNING);
  console.log('This script is intended for development purposes only.');

  if (process.env.NODE_ENV === 'production' && process.env.FORCE_DB_INIT !== 'true') {
    console.error('Refusing to run in production environment without FORCE_DB_INIT=true.');
    console.error('If you are absolutely sure, run `FORCE_DB_INIT=true npm run init-db`.');
    process.exit(1);
  }

  console.log('Starting database initialization in 5 seconds...');
  console.log('Press CTRL+C to cancel.');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Initializing database...');
  await createTables();
  console.log('Database initialized.');
  console.log('Seeding database...');
  await seedDatabase();
  console.log('Database seeded.');
}

async function seedDatabase() {
    if (!db.createUser || !db.createSlide) {
        console.log('Skipping seeding because db functions are not available.');
        return;
    }

    // 1. Create a dummy user
    let user: User;
    const existingUser = await db.findUserByEmail('testuser@example.com');
    if (existingUser) {
        user = existingUser;
        console.log('Found existing user:', user.username);
    } else {
        user = await db.createUser({
            username: 'testuser',
            displayName: 'Test User',
            email: 'testuser@example.com',
            password: 'password', // Note: In a real app, hash this properly
            avatar: '/avatars/placeholder.png',
            role: 'user',
        });
        console.log('Created new user:', user.username);
    }

    // 2. Create some video slides
    const videoSlides = [
      {
        title: 'Big Buck Bunny',
        description: 'A classic short film from the Blender Institute.',
        hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        poster: 'https://image.mux.com/x36xhzz/thumbnail.jpg',
      },
      {
        title: 'Sintel',
        description: 'Another beautiful short film by the Blender Institute.',
        hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        poster: 'https://image.mux.com/x36xhzz/thumbnail.jpg',
      },
      {
        title: 'Tears of Steel',
        description: 'A sci-fi short film.',
        hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        poster: 'https://image.mux.com/x36xhzz/thumbnail.jpg',
      },
      {
        title: 'Elephant\'s Dream',
        description: 'The first open movie by the Blender Foundation.',
        hlsUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        poster: 'https://image.mux.com/x36xhzz/thumbnail.jpg',
      }
    ];

    for (const [index, slideData] of videoSlides.entries()) {
      await db.createSlide({
        userId: user.id,
        username: user.username,
        avatar: user.avatar || '',
        x: 0, // x/y coordinates are no longer used, but schema requires them
        y: index,
        type: 'video',
        access: 'public',
        data: {
          title: slideData.title,
          description: slideData.description,
          hlsUrl: slideData.hlsUrl,
          mp4Url: '',
          poster: slideData.poster,
        },
      });
      console.log(`Created slide: ${slideData.title}`);
    }
}

main().catch(err => {
  console.error('Error initializing database:', err);
  process.exit(1);
});
