import { auth as getSession } from "@/auth";

// Drop-in replacements for the old `auth()` / `currentUser()` from
// "@clerk/nextjs/server", reshaped to the same return shape so callers
// don't need to change beyond the import line.

export async function auth() {
  const session = await getSession();
  return {
    userId: session?.user?.id,
    sessionClaims: {
      metadata: { role: session?.user?.role },
    },
  };
}

export async function currentUser() {
  const session = await getSession();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    publicMetadata: { role: session.user.role },
  };
}
