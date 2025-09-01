import { createTables } from '../lib/db-postgres';

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
}

main().catch(err => {
  console.error('Error initializing database:', err);
  process.exit(1);
});
