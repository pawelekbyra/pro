import { createTables } from '../lib/db-postgres';

async function main() {
  console.log('Initializing database...');
  await createTables();
  console.log('Database initialized.');
}

main().catch(err => {
  console.error('Error initializing database:', err);
  process.exit(1);
});
