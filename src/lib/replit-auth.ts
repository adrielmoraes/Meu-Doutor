import { headers } from 'next/headers';
import { db } from '../../server/storage';
import { replitUsers } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export interface ReplitUser {
  replitUserId: string;
  replitUserName: string;
  role?: 'doctor' | 'patient' | 'admin';
  profileId?: string;
}

export async function getReplitUser(): Promise<ReplitUser | null> {
  const headersList = await headers();
  const replitUserId = headersList.get('x-replit-user-id');
  const replitUserName = headersList.get('x-replit-user-name');

  if (!replitUserId || !replitUserName) {
    return null;
  }

  const userMapping = await db
    .select()
    .from(replitUsers)
    .where(eq(replitUsers.replitUserId, replitUserId))
    .limit(1);

  if (userMapping.length > 0) {
    return {
      replitUserId,
      replitUserName,
      role: userMapping[0].role,
      profileId: userMapping[0].profileId,
    };
  }

  return {
    replitUserId,
    replitUserName,
  };
}

export async function mapReplitUserToProfile(
  replitUserId: string,
  replitUserName: string,
  role: 'doctor' | 'patient',
  profileId: string
): Promise<void> {
  await db
    .insert(replitUsers)
    .values({
      replitUserId,
      replitUserName,
      role,
      profileId,
    })
    .onConflictDoUpdate({
      target: replitUsers.replitUserId,
      set: {
        replitUserName,
        role,
        profileId,
        updatedAt: new Date(),
      },
    });
}

export async function isReplitUserMapped(replitUserId: string): Promise<boolean> {
  const result = await db
    .select()
    .from(replitUsers)
    .where(eq(replitUsers.replitUserId, replitUserId))
    .limit(1);

  return result.length > 0;
}
