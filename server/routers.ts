import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import {
  analyzeMultipliers,
  calculateCrashPoint,
  detectPatterns,
  generatePrediction,
  simulateAntiMartingale,
  simulateFixedCashout,
  simulateMartingale,
  verifyRound,
} from "./prediction-engine";
import { generateLLMPredictionSummary, checkForRarePatterns } from "./llm-predictor";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Game Rounds Management
  rounds: router({
    create: protectedProcedure
      .input(
        z.object({
          multiplier: z.string(),
          serverSeedHash: z.string().optional(),
          clientSeed: z.string().optional(),
          nonce: z.number().optional(),
          roundTimestamp: z.date(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createGameRound(ctx.user.id, {
          multiplier: input.multiplier,
          serverSeedHash: input.serverSeedHash,
          clientSeed: input.clientSeed,
          nonce: input.nonce,
          roundTimestamp: input.roundTimestamp,
          isVerified: input.serverSeedHash ? 1 : 0,
        });
      }),

    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(100),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return db.getGameRoundsByUserId(ctx.user.id, input.limit, input.offset);
      }),

    listByDateRange: protectedProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ ctx, input }) => {
        return db.getGameRoundsInDateRange(ctx.user.id, input.startDate, input.endDate);
      }),

    import: protectedProcedure
      .input(
        z.object({
          multipliers: z.array(z.number()),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const now = new Date();
        const results = [];
        for (let i = 0; i < input.multipliers.length; i++) {
          const result = await db.createGameRound(ctx.user.id, {
            multiplier: input.multipliers[i].toFixed(2),
            roundTimestamp: new Date(now.getTime() - (input.multipliers.length - i) * 60000),
          });
          results.push(result);
        }
        return { imported: results.length };
      }),
  }),

  // Predictor Analysis
  predictor: router({
    analyze: protectedProcedure.query(async ({ ctx }) => {
      const rounds = await db.getGameRoundsByUserId(ctx.user.id, 100);
      const multipliers = rounds.map((r) => parseFloat(r.multiplier));

      if (multipliers.length === 0) {
        return {
          analysis: null,
          patterns: [],
          prediction: null,
        };
      }

      const analysis = analyzeMultipliers(multipliers);
      const patterns = detectPatterns(multipliers);
      const prediction = generatePrediction(multipliers);

      return { analysis, patterns, prediction };
    }),
  }),

  // Provably Fair Verifier
  verifier: router({
    simulate: protectedProcedure
      .input(
        z.object({
          serverSeed: z.string(),
          clientSeed: z.string(),
          nonce: z.number(),
        })
      )
      .query(({ input }) => {
        const multiplier = calculateCrashPoint(input.serverSeed, input.clientSeed, input.nonce);
        return { multiplier: multiplier.toFixed(2) };
      }),

    verify: protectedProcedure
      .input(
        z.object({
          serverSeed: z.string(),
          clientSeed: z.string(),
          nonce: z.number(),
          expectedMultiplier: z.string(),
        })
      )
      .query(({ input }) => {
        const result = verifyRound(
          input.serverSeed,
          input.clientSeed,
          input.nonce,
          parseFloat(input.expectedMultiplier)
        );
        return {
          multiplier: result.multiplier.toFixed(2),
          isValid: result.isValid,
          hash: result.hash,
        };
      }),
  }),

  // Strategy Simulator
  strategy: router({
    simulate: protectedProcedure
      .input(
        z.object({
          strategyType: z.enum(["martingale", "antiMartingale", "fixedCashout"]),
          initialBet: z.number(),
          targetMultiplier: z.number().default(2.0),
        })
      )
      .query(async ({ ctx, input }) => {
        const rounds = await db.getGameRoundsByUserId(ctx.user.id, 100);
        const multipliers = rounds.map((r) => parseFloat(r.multiplier));

        if (multipliers.length === 0) {
          return null;
        }

        let result;
        if (input.strategyType === "martingale") {
          result = simulateMartingale(multipliers, input.initialBet, input.targetMultiplier);
        } else if (input.strategyType === "antiMartingale") {
          result = simulateAntiMartingale(multipliers, input.initialBet, input.targetMultiplier);
        } else {
          result = simulateFixedCashout(multipliers, input.initialBet, input.targetMultiplier);
        }
        return result;
      }),

    save: protectedProcedure
      .input(
        z.object({
          strategyType: z.enum(["martingale", "antiMartingale", "fixedCashout"]),
          name: z.string(),
          description: z.string().optional(),
          initialBet: z.string(),
          parameters: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createUserStrategy(ctx.user.id, {
          strategyType: input.strategyType,
          name: input.name,
          description: input.description ?? null,
          initialBet: input.initialBet,
          parameters: input.parameters ?? null,
        });
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserStrategies(ctx.user.id);
    }),
  }),

  // User Alerts
  alerts: router({
    create: protectedProcedure
      .input(
        z.object({
          alertType: z.enum(["threshold", "streak", "pattern"]),
          threshold: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createUserAlert(ctx.user.id, {
          alertType: input.alertType,
          threshold: input.threshold ?? null,
        });
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserAlerts(ctx.user.id);
    }),
  }),

  // Pattern Logs
  patterns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getPatternLogs(ctx.user.id);
    }),

    detect: protectedProcedure.query(async ({ ctx }) => {
      const rounds = await db.getGameRoundsByUserId(ctx.user.id, 100);
      const multipliers = rounds.map((r) => parseFloat(r.multiplier));

      if (multipliers.length === 0) {
        return { patterns: [], rarePatternDetected: false };
      }

      const { shouldNotify, message, pattern } = checkForRarePatterns(multipliers);

      // Send owner notification if rare pattern detected
      if (shouldNotify) {
        try {
          await notifyOwner({
            title: "RARE PATTERN DETECTED",
            content: `User ${ctx.user.name}: ${message}`,
          });
        } catch (error) {
          console.error("Failed to send owner notification:", error);
        }
      }

      return {
        patterns: [],
        rarePatternDetected: shouldNotify,
        patternType: pattern,
        message,
      };
    }),
  }),

  // LLM Prediction
  llmPrediction: router({
    generate: protectedProcedure
      .input(
        z.object({
          lastN: z.number().default(20),
        })
      )
      .query(async ({ ctx, input }) => {
        const rounds = await db.getGameRoundsByUserId(ctx.user.id, 100);
        const multipliers = rounds.map((r) => parseFloat(r.multiplier));
        return generateLLMPredictionSummary(multipliers, input.lastN);
      }),
  }),
});

export type AppRouter = typeof appRouter;
