import { config } from 'dotenv';
config({ path: '.env.local' });
config(); // fallback to .env

import mongoose from 'mongoose';
import { updateExistingHrAccount } from '../src/services/adminService';

async function run() {
  console.log('--- RESUMEFLOW: Updating Existing HR Account Credentials ---');
  try {
    const targetUsername = process.env.HR_ADMIN_1_USERNAME || 'RAHR-C213';
    const targetPassword = process.env.HR_ADMIN_1_PASSWORD || 'vimal@12';

    const result = await updateExistingHrAccount(targetUsername, targetPassword, 'hr.admin1');
    if (result.success) {
      console.log('✔ Successfully updated existing HR account credentials in-place.');
      console.log('Updated Account ID:', result.adminId);
      console.log('Updated Username:', result.username);
      console.log('Permissions & Role: Preserved HR_ADMIN');
    } else {
      console.error('Failed to update HR account:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during HR account credential update:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();

