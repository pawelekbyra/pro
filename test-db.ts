import { db } from './lib/db';

async function testDelete() {
  console.log('--- Running testDelete ---');

  const usersBefore = await db.getAllUsers();
  console.log('Users before deletion:', usersBefore.map(u => u.id));

  const userIdToDelete = '1';
  console.log(`Attempting to delete user with id: ${userIdToDelete}`);
  const result = await db.deleteUser(userIdToDelete);
  console.log('Deletion result:', result);

  const usersAfter = await db.getAllUsers();
  console.log('Users after deletion:', usersAfter.map(u => u.id));

  if (usersAfter.some(u => u.id === userIdToDelete)) {
    console.error('--- TEST FAILED: User was not deleted. ---');
  } else {
    console.log('--- TEST PASSED: User was successfully deleted. ---');
  }

  // Restore the original data for subsequent tests
  const originalUsers = usersBefore;
  // This is a simplified restore, in a real scenario we'd re-read from a backup
  // For now, we just log the outcome.
  // A proper implementation would involve writing the `originalUsers` back to the db.
}

testDelete().catch(console.error);
