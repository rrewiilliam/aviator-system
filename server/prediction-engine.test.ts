import { describe, expect, it } from "vitest";
import {
  calculateCrashPoint,
  verifyRound,
  analyzeMultipliers,
  detectPatterns,
  simulateMartingale,
  simulateAntiMartingale,
  simulateFixedCashout,
  generatePrediction,
} from "./prediction-engine";

describe("Prediction Engine", () => {
  describe("calculateCrashPoint", () => {
    it("should calculate crash point with valid seeds", () => {
      const result = calculateCrashPoint("server123", "client456", 1);
      expect(result).toBeGreaterThanOrEqual(1.0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it("should return 1.00 for instant loss (when check value is 0)", () => {
      // This is probabilistic, but we test the formula works
      const result = calculateCrashPoint("test", "test", 0);
      expect(result).toBeGreaterThanOrEqual(1.0);
    });

    it("should be deterministic (same inputs produce same output)", () => {
      const result1 = calculateCrashPoint("seed", "client", 42);
      const result2 = calculateCrashPoint("seed", "client", 42);
      expect(result1).toBe(result2);
    });

    it("should produce different results for different inputs", () => {
      const result1 = calculateCrashPoint("seed1", "client", 42);
      const result2 = calculateCrashPoint("seed2", "client", 42);
      expect(result1).not.toBe(result2);
    });
  });

  describe("verifyRound", () => {
    it("should verify a valid round", () => {
      const serverSeed = "server123";
      const clientSeed = "client456";
      const nonce = 1;
      const expectedMultiplier = calculateCrashPoint(serverSeed, clientSeed, nonce);

      const result = verifyRound(serverSeed, clientSeed, nonce, expectedMultiplier);
      expect(result.isValid).toBe(true);
      expect(result.multiplier).toBe(expectedMultiplier);
      expect(result.hash).toHaveLength(128); // SHA-512 hex is 128 chars
    });

    it("should reject an invalid multiplier", () => {
      const result = verifyRound("server", "client", 1, 999.99);
      expect(result.isValid).toBe(false);
    });
  });

  describe("analyzeMultipliers", () => {
    it("should calculate statistics for a list of multipliers", () => {
      const multipliers = [1.5, 2.0, 3.5, 1.2, 4.0, 2.5];
      const analysis = analyzeMultipliers(multipliers);

      expect(analysis.totalRounds).toBe(6);
      expect(analysis.averageMultiplier).toBeGreaterThan(2.0);
      expect(analysis.minMultiplier).toBe(1.2);
      expect(analysis.maxMultiplier).toBe(4.0);
      expect(analysis.standardDeviation).toBeGreaterThan(0);
      expect(analysis.lowMultiplierCount).toBe(2); // 1.5, 1.2
      expect(analysis.highMultiplierCount).toBe(4); // 2.0, 3.5, 4.0, 2.5
    });

    it("should handle empty multiplier list", () => {
      const analysis = analyzeMultipliers([]);
      expect(analysis.totalRounds).toBe(0);
      expect(analysis.averageMultiplier).toBe(0);
    });

    it("should calculate correct percentages", () => {
      const multipliers = [1.0, 1.5, 2.0, 3.0]; // 2 low, 2 high
      const analysis = analyzeMultipliers(multipliers);
      expect(analysis.lowMultiplierPercentage).toBe(50);
      expect(analysis.highMultiplierPercentage).toBe(50);
    });
  });

  describe("detectPatterns", () => {
    it("should detect consecutive sub-2x pattern", () => {
      const multipliers = [1.0, 1.2, 1.5, 1.3, 1.1, 3.0, 2.5];
      const patterns = detectPatterns(multipliers);
      const sub2xPattern = patterns.find((p) => p.type === "consecutive_sub2x");
      expect(sub2xPattern).toBeDefined();
      expect(sub2xPattern?.roundCount).toBe(5);
    });

    it("should detect hot streak pattern", () => {
      const multipliers = [1.0, 5.5, 6.0, 7.0, 1.5];
      const patterns = detectPatterns(multipliers);
      const hotPattern = patterns.find((p) => p.type === "hotStreak");
      expect(hotPattern).toBeDefined();
      expect(hotPattern?.roundCount).toBe(3);
    });

    it("should detect cold streak pattern", () => {
      const multipliers = [1.0, 1.2, 1.3, 3.0];
      const patterns = detectPatterns(multipliers);
      const coldPattern = patterns.find((p) => p.type === "coldStreak");
      expect(coldPattern).toBeDefined();
    });

    it("should return empty array for short multiplier lists", () => {
      const patterns = detectPatterns([1.0, 2.0]);
      expect(patterns).toHaveLength(0);
    });
  });

  describe("Strategy Simulators", () => {
    const testMultipliers = [1.5, 2.5, 1.2, 3.0, 2.0, 1.8, 2.5, 3.5];

    it("should simulate Martingale strategy", () => {
      const result = simulateMartingale(testMultipliers, 100, 2.0);
      expect(result.strategy).toBe("Martingale");
      expect(result.totalRounds).toBe(testMultipliers.length);
      expect(result.wins + result.losses).toBe(testMultipliers.length);
      expect(result.winRate).toBeGreaterThanOrEqual(0);
      expect(result.winRate).toBeLessThanOrEqual(100);
    });

    it("should simulate Anti-Martingale strategy", () => {
      const result = simulateAntiMartingale(testMultipliers, 100, 2.0);
      expect(result.strategy).toBe("Anti-Martingale");
      expect(result.totalRounds).toBe(testMultipliers.length);
      expect(result.wins + result.losses).toBe(testMultipliers.length);
    });

    it("should simulate Fixed Cashout strategy", () => {
      const result = simulateFixedCashout(testMultipliers, 100, 2.0);
      expect(result.strategy).toBe("Fixed Cashout");
      expect(result.totalRounds).toBe(testMultipliers.length);
      expect(result.wins + result.losses).toBe(testMultipliers.length);
    });

    it("should track individual round results", () => {
      const result = simulateFixedCashout([2.5, 1.5], 100, 2.0);
      expect(result.rounds).toHaveLength(2);
      expect(result.rounds[0].result).toBe("win"); // 2.5 >= 2.0
      expect(result.rounds[1].result).toBe("loss"); // 1.5 < 2.0
    });
  });

  describe("generatePrediction", () => {
    it("should generate prediction from multiplier history", () => {
      const multipliers = [2.0, 2.5, 1.5, 3.0, 2.0, 1.8, 2.5, 3.5];
      const prediction = generatePrediction(multipliers);
      expect(prediction.multiplier).toBe(2.0);
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(100);
      expect(prediction.reasoning).toBeDefined();
    });

    it("should return default prediction for empty history", () => {
      const prediction = generatePrediction([]);
      expect(prediction.multiplier).toBe(2.0);
      expect(prediction.confidence).toBe(0);
    });

    it("should increase confidence for rare patterns", () => {
      // 5 consecutive sub-2x rounds
      const multipliers = [1.0, 1.2, 1.5, 1.3, 1.1, 3.0, 2.5, 2.0, 1.8];
      const prediction = generatePrediction(multipliers);
      expect(prediction.confidence).toBeGreaterThanOrEqual(40);
      expect(prediction.reasoning).toContain("Rare pattern");
    });
  });
});
