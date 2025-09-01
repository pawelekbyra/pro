import { db } from '../lib/db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

async function createAdmin() {
  console.log('Starting admin user creation script...');

  try {
    const adminUsername = 'admin';
    const adminEmail = 'admin@example.com';
    const adminPassword = randomBytes(16).toString('hex'); // Generate a random password
    console.log(`Generated admin password: ${adminPassword}`);


    // 1. Check if admin user already exists
    let adminUser = await db.findUserByEmail(adminEmail);

    if (adminUser) {
      console.log(`User '${adminUsername}' already exists.`);
      // 2a. If user exists, ensure their role is 'admin'
      if (adminUser.role !== 'admin') {
        console.log("Updating user to have 'admin' role.");
        await db.updateUser(adminUser.id, { role: 'admin' });
      } else {
        console.log("User is already an admin.");
      }
    } else {
      // 2b. If user does not exist, create them
      console.log(`User '${adminUsername}' not found. Creating new admin user.`);
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
      console.log('Password hashed successfully.');

      adminUser = await db.createUser({
        username: adminUsername,
        email: adminEmail,
        password: passwordHash,
        role: 'admin',
        displayName: 'Administrator',
        avatar: 'https://i.pravatar.cc/150?u=admin',
      });
      console.log('Admin user created successfully.');
    }

    console.log('Admin user object after creation/update:', adminUser);

    // 3. Verify the user
    const verifiedUser = await db.findUserById(adminUser.id);
    console.log('Verified user object from DB:', verifiedUser);

    if (verifiedUser && verifiedUser.role === 'admin') {
      console.log('Verification successful: Admin user is configured correctly.');
    } else {
      throw new Error('Verification failed: Could not find admin user with admin role after update.');
    }

    console.log('Admin user script finished successfully! ✅');

  } catch (error) {
    console.error('Error during admin user creation:', error);
    process.exit(1);
  }
}

createAdmin();
