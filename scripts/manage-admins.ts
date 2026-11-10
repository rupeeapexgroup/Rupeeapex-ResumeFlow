import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/mongodb';
import { Admin } from '../src/models/Admin';
import { MAX_ADMIN_ACCOUNTS } from '../src/services/adminService';

async function main() {
  await connectToDatabase();
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  if (command === 'list') {
    const admins = await Admin.find().sort({ createdAt: 1 });
    console.log(`\n==================================================`);
    console.log(`HR ADMIN ACCOUNTS IN DATABASE (${admins.length} / ${MAX_ADMIN_ACCOUNTS})`);
    console.log(`==================================================`);
    admins.forEach((admin, index) => {
      console.log(
        `[#${index + 1}] ID: ${admin._id} | Username: ${admin.username} | Role: ${admin.role} | Active: ${admin.isActive} | Hash: ${admin.passwordHash.substring(0, 10)}...`
      );
    });
    console.log(`--------------------------------------------------`);
    if (admins.length >= MAX_ADMIN_ACCOUNTS) {
      console.log(`STATUS: Sign-up is CLOSED (Maximum of ${MAX_ADMIN_ACCOUNTS} accounts reached).`);
    } else {
      console.log(`STATUS: Sign-up is OPEN (${MAX_ADMIN_ACCOUNTS - admins.length} slot(s) remaining).`);
    }
    console.log(`==================================================\n`);
  } else if (command === 'delete') {
    const usernameToDelete = args[1]?.trim().toLowerCase();
    if (!usernameToDelete) {
      console.error('Usage: tsx scripts/manage-admins.ts delete <username>');
      process.exit(1);
    }
    const res = await Admin.deleteOne({ username: usernameToDelete });
    if (res.deletedCount > 0) {
      console.log(`✔ Successfully deleted admin account: ${usernameToDelete}`);
      const count = await Admin.countDocuments();
      console.log(`Remaining accounts in DB: ${count} / ${MAX_ADMIN_ACCOUNTS}`);
      console.log(`Sign-up slots open: ${Math.max(0, MAX_ADMIN_ACCOUNTS - count)}`);
    } else {
      console.error(`Account '${usernameToDelete}' not found in database.`);
    }
  } else if (command === 'reset') {
    // Delete all admins so user can test fresh sign-ups
    const res = await Admin.deleteMany({});
    console.log(`✔ Reset complete: Deleted ${res.deletedCount} admin account(s).`);
    console.log(`Sign-up is now OPEN for 2 new accounts!`);
  } else {
    console.log('Commands: list | delete <username> | reset');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

