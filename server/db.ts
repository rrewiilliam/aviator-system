import { eq, desc, gte, lte, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  gameRounds,
  userStrategies,
  userAlerts,
  patternLogs,
  type InsertGameRound,
  type InsertUserStrategy,
  type InsertUserAlert,
  type InsertPatternLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Game Rounds Queries
 */
export async function createGameRound(
  userId: number,
  round: Omit<InsertGameRound, "userId">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(gameRounds).values({ ...round, userId });
  return result;
}

export async function getGameRoundsByUserId(userId: number, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(gameRounds)
    .where(eq(gameRounds.userId, userId))
    .orderBy(desc(gameRounds.roundTimestamp))
    .limit(limit)
    .offset(offset);
}

export async function getGameRoundsInDateRange(
  userId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(gameRounds)
    .where(
      and(
        eq(gameRounds.userId, userId),
        gte(gameRounds.roundTimestamp, startDate),
        lte(gameRounds.roundTimestamp, endDate)
      )
    )
    .orderBy(desc(gameRounds.roundTimestamp));
}

/**
 * User Strategies Queries
 */
export async function createUserStrategy(
  userId: number,
  strategy: Omit<InsertUserStrategy, "userId">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(userStrategies).values({ ...strategy, userId });
}

export async function getUserStrategies(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(userStrategies)
    .where(eq(userStrategies.userId, userId))
    .orderBy(desc(userStrategies.createdAt));
}

/**
 * User Alerts Queries
 */
export async function createUserAlert(
  userId: number,
  alert: Omit<InsertUserAlert, "userId">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(userAlerts).values({ ...alert, userId });
}

export async function getUserAlerts(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(userAlerts)
    .where(eq(userAlerts.userId, userId))
    .orderBy(desc(userAlerts.createdAt));
}

/**
 * Pattern Logs Queries
 */
export async function createPatternLog(userId: number, pattern: InsertPatternLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(patternLogs).values({ ...pattern, userId });
}

export async function getPatternLogs(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(patternLogs)
    .where(eq(patternLogs.userId, userId))
    .orderBy(desc(patternLogs.detectedAt))
    .limit(limit);
}
