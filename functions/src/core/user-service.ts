import { FieldValue } from "firebase-admin/firestore";
import { db, orgDb } from "../shared/db";
import type { User, OrgMember, LineClientWrapper } from "../shared/types";

export async function ensureUser(
  lineUserId: string,
  lineClient?: LineClientWrapper
): Promise<User> {
  const userRef = db.collection("users").doc(lineUserId);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    return { lineUserId, ...userDoc.data() } as User;
  }

  let displayName: string | null = null;
  let pictureUrl: string | null = null;

  if (lineClient) {
    try {
      const profile = await lineClient.getProfile(lineUserId);
      displayName = profile.displayName;
      pictureUrl = profile.pictureUrl ?? null;
    } catch {
      // Profile fetch may fail; proceed with nulls
    }
  }

  const userData = {
    lineUserId,
    displayName,
    pictureUrl,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await userRef.set(userData, { merge: true });

  return userData as unknown as User;
}

export async function ensureMember(orgId: string, userId: string): Promise<OrgMember> {
  const memberRef = orgDb(orgId).collection("members").doc(userId);
  const memberDoc = await memberRef.get();

  if (memberDoc.exists) {
    return { userId, ...memberDoc.data() } as OrgMember;
  }

  const memberData = {
    userId,
    role: "member" as const,
    joinedAt: FieldValue.serverTimestamp(),
  };

  await memberRef.set(memberData, { merge: true });

  return memberData as unknown as OrgMember;
}

export async function resolveUser(
  lineUserId: string,
  orgId: string,
  lineClient?: LineClientWrapper
): Promise<{ user: User; member: OrgMember }> {
  const user = await ensureUser(lineUserId, lineClient);
  const member = await ensureMember(orgId, lineUserId);
  return { user, member };
}
