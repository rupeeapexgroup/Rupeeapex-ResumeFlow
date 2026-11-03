import { connectToDatabase } from '@/lib/mongodb';
import { Admin, IAdmin } from '@/models/Admin';
import { hashPassword, verifyPassword, createSessionToken } from '@/lib/auth';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes lockout

export async function loginAdmin(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  await connectToDatabase();

  const normalizedUsername = username.trim().toLowerCase();
  const admin = await Admin.findOne({ username: normalizedUsername });

  if (!admin) {
    return { success: false, error: 'Invalid username or password' };
  }

  if (!admin.isActive) {
    return { success: false, error: 'Account has been deactivated. Please contact administrator.' };
  }

  // Check lockout
  if (admin.lockUntil && admin.lockUntil.getTime() > Date.now()) {
    const minutesLeft = Math.ceil((admin.lockUntil.getTime() - Date.now()) / (60 * 1000));
    return {
      success: false,
      error: `Too many failed login attempts. Account temporarily locked. Try again in ${minutesLeft} minutes.`,
    };
  }

  const isPasswordValid = await verifyPassword(password, admin.passwordHash);

  if (!isPasswordValid) {
    admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
    if (admin.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      admin.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      await admin.save();
      return {
        success: false,
        error: `Account locked due to 5 consecutive failed attempts. Please try again after 15 minutes.`,
      };
    }
    await admin.save();
    return { success: false, error: 'Invalid username or password' };
  }

  // Reset failed attempts on successful login
  admin.failedLoginAttempts = 0;
  admin.lockUntil = undefined;
  admin.lastLoginAt = new Date();
  await admin.save();

  const token = await createSessionToken({
    userId: admin._id.toString(),
    username: admin.username,
    role: admin.role,
  });

  return { success: true, token };
}

/**
 * Provisions the two pre-authorized HR accounts as required by specs
 */
export async function seedInitialAdmins(): Promise<{ created: string[]; existing: string[] }> {
  await connectToDatabase();

  const admin1User = process.env.HR_ADMIN_1_USERNAME || 'hr.admin1';
  const admin1Pass = process.env.HR_ADMIN_1_PASSWORD || 'RupeeapexHR1@2026';

  const admin2User = process.env.HR_ADMIN_2_USERNAME || 'hr.admin2';
  const admin2Pass = process.env.HR_ADMIN_2_PASSWORD || 'RupeeapexHR2@2026';

  const accounts = [
    { username: admin1User, password: admin1Pass },
    { username: admin2User, password: admin2Pass },
  ];

  const created: string[] = [];
  const existing: string[] = [];

  for (const acc of accounts) {
    const norm = acc.username.trim().toLowerCase();
    const found = await Admin.findOne({ username: norm });
    if (!found) {
      const passwordHash = await hashPassword(acc.password);
      await Admin.create({
        username: norm,
        passwordHash,
        role: 'HR_ADMIN',
        isActive: true,
      });
      created.push(norm);
    } else {
      existing.push(norm);
    }
  }

  return { created, existing };
}
