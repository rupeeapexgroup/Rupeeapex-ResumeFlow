import { connectToDatabase } from '@/lib/mongodb';
import { Admin, IAdmin } from '@/models/Admin';
import { hashPassword, verifyPassword, createSessionToken } from '@/lib/auth';

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

  const isPasswordValid = await verifyPassword(password, admin.passwordHash);

  if (!isPasswordValid) {
    return { success: false, error: 'Invalid username or password' };
  }

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
 * Updates the existing HR account credentials in-place without creating a new or duplicate account.
 * Preserves the existing account _id, role permissions, and access history.
 * Hashes the new password with bcrypt (salt rounds = 12).
 */
export async function updateExistingHrAccount(
  newUsername: string = process.env.HR_ADMIN_1_USERNAME || 'RAHR-C213',
  newPassword: string = process.env.HR_ADMIN_1_PASSWORD || 'vimal@12',
  oldUsername?: string
): Promise<{ success: boolean; adminId?: string; username?: string; error?: string }> {
  await connectToDatabase();

  const targetUsername = newUsername.trim().toLowerCase();
  const newHash = await hashPassword(newPassword);

  // 1. Look for existing admin that already has the target username
  let targetAdmin = await Admin.findOne({ username: targetUsername });
  if (targetAdmin) {
    targetAdmin.passwordHash = newHash;
    targetAdmin.isActive = true;
    await targetAdmin.save();
    return {
      success: true,
      adminId: targetAdmin._id.toString(),
      username: targetAdmin.username,
    };
  }

  // 2. Find the existing HR account to update in-place:
  if (oldUsername) {
    targetAdmin = await Admin.findOne({ username: oldUsername.trim().toLowerCase() });
  }

  if (!targetAdmin) {
    targetAdmin = await Admin.findOne({ username: 'hr.admin1' });
  }

  if (!targetAdmin) {
    // Update the first existing admin in the database
    targetAdmin = await Admin.findOne().sort({ createdAt: 1 });
  }

  if (targetAdmin) {
    // Preserve _id and permissions, update credentials in-place
    targetAdmin.username = targetUsername;
    targetAdmin.passwordHash = newHash;
    targetAdmin.isActive = true;
    await targetAdmin.save();

    return {
      success: true,
      adminId: targetAdmin._id.toString(),
      username: targetAdmin.username,
    };
  }

  // 3. Fallback: only if database has zero accounts
  const created = await Admin.create({
    username: targetUsername,
    passwordHash: newHash,
    role: 'HR_ADMIN',
    isActive: true,
  });

  return {
    success: true,
    adminId: created._id.toString(),
    username: created.username,
  };
}

/**
 * Provisions the pre-authorized HR accounts or updates existing accounts in-place.
 */
export async function seedInitialAdmins(): Promise<{ created: string[]; existing: string[] }> {
  await connectToDatabase();

  const admin1User = process.env.HR_ADMIN_1_USERNAME || 'RAHR-C213';
  const admin1Pass = process.env.HR_ADMIN_1_PASSWORD || 'vimal@12';

  const admin2User = process.env.HR_ADMIN_2_USERNAME || 'hr.admin2';
  const admin2Pass = process.env.HR_ADMIN_2_PASSWORD || 'RupeeapexHR2@2026';

  const accounts = [
    { username: admin1User, password: admin1Pass, oldUsername: 'hr.admin1' },
    { username: admin2User, password: admin2Pass },
  ];

  const created: string[] = [];
  const existing: string[] = [];

  for (const acc of accounts) {
    const norm = acc.username.trim().toLowerCase();
    let found = await Admin.findOne({ username: norm });

    if (!found && acc.oldUsername) {
      // Find old account to update in-place rather than creating duplicate
      found = await Admin.findOne({ username: acc.oldUsername.toLowerCase() });
      if (found) {
        found.username = norm;
        found.passwordHash = await hashPassword(acc.password);
        found.isActive = true;
        await found.save();
        existing.push(norm);
        continue;
      }
    }

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

export const MAX_ADMIN_ACCOUNTS = 2;

/**
 * Checks whether new signups are allowed and returns current registration statistics.
 */
export async function getSignupStatus(): Promise<{
  allowed: boolean;
  totalAccounts: number;
  maxAccounts: number;
  remainingSlots: number;
}> {
  await connectToDatabase();
  const totalAccounts = await Admin.countDocuments();
  return {
    allowed: totalAccounts < MAX_ADMIN_ACCOUNTS,
    totalAccounts,
    maxAccounts: MAX_ADMIN_ACCOUNTS,
    remainingSlots: Math.max(0, MAX_ADMIN_ACCOUNTS - totalAccounts),
  };
}

/**
 * Registers a new HR Admin account if total accounts in database < MAX_ADMIN_ACCOUNTS (2).
 * Enforces maximum 2 accounts strictly: once 2 exist, no further accounts can be created.
 */
export async function registerAdmin(
  username: string,
  password: string
): Promise<{
  success: boolean;
  token?: string;
  adminId?: string;
  username?: string;
  error?: string;
}> {
  await connectToDatabase();

  const totalAccounts = await Admin.countDocuments();
  if (totalAccounts >= MAX_ADMIN_ACCOUNTS) {
    return {
      success: false,
      error: `Registration closed: The maximum limit of ${MAX_ADMIN_ACCOUNTS} HR accounts has already been reached. No more sign-ups are allowed.`,
    };
  }

  const normalizedUsername = username.trim().toLowerCase();

  const existing = await Admin.findOne({ username: normalizedUsername });
  if (existing) {
    return {
      success: false,
      error: `Username '${normalizedUsername}' is already taken. Please choose another username.`,
    };
  }

  const passwordHash = await hashPassword(password);

  try {
    const newAdmin = await Admin.create({
      username: normalizedUsername,
      passwordHash,
      role: 'HR_ADMIN',
      isActive: true,
    });

    const token = await createSessionToken({
      userId: newAdmin._id.toString(),
      username: newAdmin.username,
      role: newAdmin.role,
    });

    return {
      success: true,
      token,
      adminId: newAdmin._id.toString(),
      username: newAdmin.username,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to create account due to server validation.',
    };
  }
}
