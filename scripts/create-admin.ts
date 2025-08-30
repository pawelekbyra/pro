import { kv } from '../lib/kv';
import { User } from '../lib/db';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  console.log('Starting admin user creation script...');

  try {
    const adminUsername = 'admin';
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin'; // Simple password for local dev

    // 1. Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
    console.log('Password hashed successfully.');

    // 2. Fetch current users from KV
    const users = (await kv.get<User[]>('users')) ?? [];
    console.log(`Found ${users.length} existing users.`);

    // 3. Check if admin user exists
    const adminUserIndex = users.findIndex((u) => u.username === adminUsername);

    if (adminUserIndex > -1) {
      // 4a. Admin exists, update their role and password if needed
      console.log(
        `User '${adminUsername}' already exists. Updating role to 'admin'.`
      );
      users[adminUserIndex].role = 'admin';
      // Optional: uncomment to reset password on every run
      // users[adminUserIndex].passwordHash = passwordHash;
    } else {
      // 4b. Admin does not exist, create a new user
      console.log(
        `User '${adminUsername}' not found. Creating new admin user.`
      );
      const newAdmin: User = {
        id: crypto.randomUUID(),
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        displayName: 'Administrator',
        avatar: 'https://i.pravatar.cc/150?u=admin',
        sessionVersion: 1,
      };
      users.push(newAdmin);
    }

    // 5. Save the updated users array back to KV
    await kv.set('users', users);
    console.log('Successfully updated users in Vercel KV.');

    // 6. Verify by fetching the user
    const allUsers = (await kv.get<User[]>('users')) ?? [];
    const admin = allUsers.find((u) => u.username === adminUsername);
    if (admin && admin.role === 'admin') {
      console.log(
        'Verification successful: Admin user is configured correctly.'
      );
    } else {
      throw new Error(
        'Verification failed: Could not find admin user with admin role after update.'
      );
    }

    console.log('Admin user script finished successfully! ✅');
  } catch (error) {
    console.error('Error during admin user creation:', error);
    process.exit(1);
  }
}

createAdmin();
