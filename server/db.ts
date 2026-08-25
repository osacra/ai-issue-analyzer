import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  analyses,
  InsertAnalysis,
  InsertIssue,
  InsertUser,
  issues,
  users,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }
  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

export async function createIssue(input: InsertIssue) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(issues).values(input);
  return getIssueById(Number(result[0].insertId), input.userId);
}

export async function listIssues(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db
    .select()
    .from(issues)
    .where(eq(issues.userId, userId))
    .orderBy(desc(issues.createdAt));
}

export async function getIssueById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db
    .select()
    .from(issues)
    .where(eq(issues.id, id))
    .limit(1);
  const issue = result[0];
  return issue?.userId === userId ? issue : undefined;
}

export async function deleteIssue(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const issue = await getIssueById(id, userId);
  if (!issue) return false;
  await db.delete(analyses).where(eq(analyses.issueId, id));
  await db.delete(issues).where(eq(issues.id, id));
  return true;
}

export async function listAnalyses(issueId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db
    .select()
    .from(analyses)
    .where(eq(analyses.issueId, issueId))
    .orderBy(desc(analyses.createdAt));
}

export async function createAnalysis(input: InsertAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(analyses).values(input);
  await db
    .update(issues)
    .set({ status: "analyzed" })
    .where(eq(issues.id, input.issueId));
  const result = await db
    .select()
    .from(analyses)
    .where(eq(analyses.issueId, input.issueId))
    .orderBy(desc(analyses.createdAt))
    .limit(1);
  return result[0];
}
