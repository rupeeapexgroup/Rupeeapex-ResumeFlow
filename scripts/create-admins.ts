import { config } from 'dotenv';
config({ path: '.env.local' });
config(); // fallback to .env

import { seedInitialAdmins } from '../src/services/adminService';
import mongoose from 'mongoose';

async function run() {
  console.log('--- RESUMEFLOW: Initializing HR Accounts ---');
  try {
    const result = await seedInitialAdmins();
    console.log('Newly Provisioned Accounts:', result.created);
    console.log('Already Existing Accounts:', result.existing);
    console.log('Total HR Accounts Available:', result.created.length + result.existing.length);
    console.log('Successfully completed HR account provisioning.');
  } catch (error) {
    console.error('Failed to provision HR accounts:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();

