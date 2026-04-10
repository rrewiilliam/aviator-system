import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Game Rounds table: stores multiplier results from Aviator rounds
 */
export const gameRounds = mysqlTable("gameRounds", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  multiplier: varchar("multiplier", { length: 10 }).notNull(), // e.g., "17.56"
  serverSeedHash: varchar("serverSeedHash", { length: 128 }), // SHA-512 hash
  clientSeed: varchar("clientSeed", { length: 128 }),
  nonce: int("nonce"),
  roundTimestamp: timestamp("roundTimestamp").notNull(),
  isVerified: int("isVerified").default(0), // 0 = not verified, 1 = verified
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameRound = typeof gameRounds.$inferSelect;
export type InsertGameRound = typeof gameRounds.$inferInsert;

/**
 * User Strategies table: stores user-defined betting strategies
 */
export const userStrategies = mysqlTable("userStrategies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  strategyType: mysqlEnum("strategyType", ["martingale", "antiMartingale", "fixedCashout"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  initialBet: varchar("initialBet", { length: 20 }).notNull(), // e.g., "100"
  parameters: text("parameters"), // JSON string for strategy-specific params
  profitLoss: varchar("profitLoss", { length: 20 }).default("0"),
  roundsSimulated: int("roundsSimulated").default(0),
  winRate: varchar("winRate", { length: 10 }).default("0"), // percentage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserStrategy = typeof userStrategies.$inferSelect;
export type InsertUserStrategy = typeof userStrategies.$inferInsert;

/**
 * User Alerts table: stores user-defined multiplier threshold alerts
 */
export const userAlerts = mysqlTable("userAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  alertType: mysqlEnum("alertType", ["threshold", "streak", "pattern"]).notNull(),
  threshold: varchar("threshold", { length: 10 }), // e.g., "5.00" for multiplier alerts
  isActive: int("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserAlert = typeof userAlerts.$inferSelect;
export type InsertUserAlert = typeof userAlerts.$inferInsert;

/**
 * Pattern Logs table: stores detected patterns in game history
 */
export const patternLogs = mysqlTable("patternLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  patternType: mysqlEnum("patternType", ["rainbow", "double", "hotStreak", "coldStreak", "consecutive_sub2x"]).notNull(),
  description: text("description"),
  roundCount: int("roundCount"),
  confidence: varchar("confidence", { length: 10 }).default("0"), // 0-100 percentage
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
});

export type PatternLog = typeof patternLogs.$inferSelect;
export type InsertPatternLog = typeof patternLogs.$inferInsert;