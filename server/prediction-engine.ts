import crypto from "crypto";

/**
 * Provably Fair Prediction Engine for Aviator Game
 * Implements the SHA-512 based crash point calculation
 */

export interface PredictionResult {
  multiplier: number;
  confidence: number;
  reasoning: string;
}

export interface VerificationResult {
  multiplier: number;
  isValid: boolean;
  hash: string;
}

export interface StrategySimulationResult {
  strategy: string;
  totalRounds: number;
  wins: number;
  losses: number;
  profitLoss: number;
  winRate: number;
  rounds: Array<{
    round: number;
    multiplier: number;
    bet: number;
    cashout: number;
    result: "win" | "loss";
    profit: number;
  }>;
}

/**
 * Calculate the crash point multiplier using the Aviator Provably Fair algorithm
 * Formula: CrashPoint = (100 - HouseEdge) / (1 - h) / 100
 * where h is the normalized hash value from the first 13 hex characters of SHA-512
 */
export function calculateCrashPoint(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  houseEdge: number = 3
): number {
  // Concatenate all inputs
  const combined = `${serverSeed}${clientSeed}${nonce}`;

  // Generate SHA-512 hash
  const hash = crypto.createHash("sha512").update(combined).digest("hex");

  // Extract first 13 hex characters (52 bits)
  const hexSlice = hash.substring(0, 13);

  // Convert to decimal
  const decimalValue = parseInt(hexSlice, 16);

  // Normalize to [0, 1) by dividing by 2^52
  const h = decimalValue / Math.pow(2, 52);

  // Check for instant 1.00x
  const checkValue = decimalValue % Math.floor(100 / houseEdge);
  if (checkValue === 0) {
    return 1.0;
  }

  // Apply crash point formula
  const crashPoint = ((100 - houseEdge) / (1 - h)) / 100;

  // Floor to 2 decimal places
  return Math.floor(crashPoint * 100) / 100;
}

/**
 * Verify a past round using the Provably Fair algorithm
 */
export function verifyRound(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  expectedMultiplier: number
): VerificationResult {
  const calculatedMultiplier = calculateCrashPoint(serverSeed, clientSeed, nonce);
  const combined = `${serverSeed}${clientSeed}${nonce}`;
  const hash = crypto.createHash("sha512").update(combined).digest("hex");

  return {
    multiplier: calculatedMultiplier,
    isValid: Math.abs(calculatedMultiplier - expectedMultiplier) < 0.01,
    hash,
  };
}

/**
 * Statistical Analysis Module
 */
export interface StatisticalAnalysis {
  totalRounds: number;
  averageMultiplier: number;
  minMultiplier: number;
  maxMultiplier: number;
  standardDeviation: number;
  variance: number;
  medianMultiplier: number;
  lowMultiplierCount: number; // < 2.0x
  highMultiplierCount: number; // >= 2.0x
  lowMultiplierPercentage: number;
  highMultiplierPercentage: number;
}

export function analyzeMultipliers(multipliers: number[]): StatisticalAnalysis {
  if (multipliers.length === 0) {
    return {
      totalRounds: 0,
      averageMultiplier: 0,
      minMultiplier: 0,
      maxMultiplier: 0,
      standardDeviation: 0,
      variance: 0,
      medianMultiplier: 0,
      lowMultiplierCount: 0,
      highMultiplierCount: 0,
      lowMultiplierPercentage: 0,
      highMultiplierPercentage: 0,
    };
  }

  const sorted = [...multipliers].sort((a, b) => a - b);
  const mean = multipliers.reduce((a, b) => a + b, 0) / multipliers.length;

  // Calculate variance and standard deviation
  const variance =
    multipliers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    multipliers.length;
  const stdDev = Math.sqrt(variance);

  // Calculate median
  const median =
    multipliers.length % 2 === 0
      ? (sorted[multipliers.length / 2 - 1] + sorted[multipliers.length / 2]) / 2
      : sorted[Math.floor(multipliers.length / 2)];

  // Count low and high multipliers
  const lowCount = multipliers.filter((m) => m < 2.0).length;
  const highCount = multipliers.filter((m) => m >= 2.0).length;

  return {
    totalRounds: multipliers.length,
    averageMultiplier: Math.round(mean * 100) / 100,
    minMultiplier: sorted[0],
    maxMultiplier: sorted[sorted.length - 1],
    standardDeviation: Math.round(stdDev * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    medianMultiplier: Math.round(median * 100) / 100,
    lowMultiplierCount: lowCount,
    highMultiplierCount: highCount,
    lowMultiplierPercentage: Math.round((lowCount / multipliers.length) * 100),
    highMultiplierPercentage: Math.round((highCount / multipliers.length) * 100),
  };
}

/**
 * Pattern Recognition Module
 */
export interface DetectedPattern {
  type: "rainbow" | "double" | "hotStreak" | "coldStreak" | "consecutive_sub2x";
  description: string;
  roundCount: number;
  confidence: number;
  startIndex: number;
}

export function detectPatterns(multipliers: number[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  if (multipliers.length < 3) return patterns;

  // Detect rainbow pattern (alternating low/high)
  let rainbowCount = 0;
  let rainbowStart = 0;
  for (let i = 1; i < multipliers.length; i++) {
    const isLow = multipliers[i] < 2.0;
    const prevIsLow = multipliers[i - 1] < 2.0;
    if (isLow !== prevIsLow) {
      rainbowCount++;
    } else {
      if (rainbowCount >= 4) {
        patterns.push({
          type: "rainbow",
          description: `Alternating low/high pattern detected (${rainbowCount + 1} rounds)`,
          roundCount: rainbowCount + 1,
          confidence: Math.min(90, 50 + rainbowCount * 5),
          startIndex: rainbowStart,
        });
      }
      rainbowCount = 0;
      rainbowStart = i;
    }
  }

  // Detect consecutive sub-2x rounds
  let sub2xCount = 0;
  let sub2xStart = 0;
  for (let i = 0; i < multipliers.length; i++) {
    if (multipliers[i] < 2.0) {
      if (sub2xCount === 0) sub2xStart = i;
      sub2xCount++;
    } else {
      if (sub2xCount >= 5) {
        patterns.push({
          type: "consecutive_sub2x",
          description: `${sub2xCount} consecutive rounds below 2.0x (rare pattern)`,
          roundCount: sub2xCount,
          confidence: Math.min(95, 60 + sub2xCount * 5),
          startIndex: sub2xStart,
        });
      }
      sub2xCount = 0;
    }
  }

  // Detect hot streak (high multipliers)
  let hotCount = 0;
  let hotStart = 0;
  for (let i = 0; i < multipliers.length; i++) {
    if (multipliers[i] >= 5.0) {
      if (hotCount === 0) hotStart = i;
      hotCount++;
    } else {
      if (hotCount >= 3) {
        patterns.push({
          type: "hotStreak",
          description: `Hot streak: ${hotCount} consecutive rounds >= 5.0x`,
          roundCount: hotCount,
          confidence: Math.min(85, 50 + hotCount * 10),
          startIndex: hotStart,
        });
      }
      hotCount = 0;
    }
  }

  // Detect cold streak (low multipliers)
  let coldCount = 0;
  let coldStart = 0;
  for (let i = 0; i < multipliers.length; i++) {
    if (multipliers[i] < 1.5) {
      if (coldCount === 0) coldStart = i;
      coldCount++;
    } else {
      if (coldCount >= 3) {
        patterns.push({
          type: "coldStreak",
          description: `Cold streak: ${coldCount} consecutive rounds < 1.5x`,
          roundCount: coldCount,
          confidence: Math.min(80, 50 + coldCount * 8),
          startIndex: coldStart,
        });
      }
      coldCount = 0;
    }
  }

  return patterns;
}

/**
 * Strategy Simulator Module
 */
export function simulateMartingale(
  multipliers: number[],
  initialBet: number,
  targetMultiplier: number = 2.0
): StrategySimulationResult {
  let currentBet = initialBet;
  let totalProfit = 0;
  let wins = 0;
  let losses = 0;
  const rounds: StrategySimulationResult["rounds"] = [];

  for (let i = 0; i < multipliers.length; i++) {
    const multiplier = multipliers[i];
    const cashout = currentBet * targetMultiplier;
    const result = multiplier >= targetMultiplier ? "win" : "loss";

    if (result === "win") {
      const profit = cashout - currentBet;
      totalProfit += profit;
      wins++;
      currentBet = initialBet; // Reset bet after win
    } else {
      totalProfit -= currentBet;
      losses++;
      currentBet *= 2; // Double bet after loss (Martingale)
    }

    rounds.push({
      round: i + 1,
      multiplier,
      bet: currentBet,
      cashout,
      result,
      profit: result === "win" ? cashout - currentBet : -currentBet,
    });
  }

  return {
    strategy: "Martingale",
    totalRounds: multipliers.length,
    wins,
    losses,
    profitLoss: Math.round(totalProfit * 100) / 100,
    winRate: Math.round((wins / multipliers.length) * 100),
    rounds,
  };
}

export function simulateAntiMartingale(
  multipliers: number[],
  initialBet: number,
  targetMultiplier: number = 2.0
): StrategySimulationResult {
  let currentBet = initialBet;
  let totalProfit = 0;
  let wins = 0;
  let losses = 0;
  const rounds: StrategySimulationResult["rounds"] = [];

  for (let i = 0; i < multipliers.length; i++) {
    const multiplier = multipliers[i];
    const cashout = currentBet * targetMultiplier;
    const result = multiplier >= targetMultiplier ? "win" : "loss";

    if (result === "win") {
      const profit = cashout - currentBet;
      totalProfit += profit;
      wins++;
      currentBet *= 2; // Double bet after win (Anti-Martingale)
    } else {
      totalProfit -= currentBet;
      losses++;
      currentBet = initialBet; // Reset bet after loss
    }

    rounds.push({
      round: i + 1,
      multiplier,
      bet: currentBet,
      cashout,
      result,
      profit: result === "win" ? cashout - currentBet : -currentBet,
    });
  }

  return {
    strategy: "Anti-Martingale",
    totalRounds: multipliers.length,
    wins,
    losses,
    profitLoss: Math.round(totalProfit * 100) / 100,
    winRate: Math.round((wins / multipliers.length) * 100),
    rounds,
  };
}

export function simulateFixedCashout(
  multipliers: number[],
  initialBet: number,
  targetMultiplier: number = 2.0
): StrategySimulationResult {
  let totalProfit = 0;
  let wins = 0;
  let losses = 0;
  const rounds: StrategySimulationResult["rounds"] = [];

  for (let i = 0; i < multipliers.length; i++) {
    const multiplier = multipliers[i];
    const cashout = initialBet * targetMultiplier;
    const result = multiplier >= targetMultiplier ? "win" : "loss";

    if (result === "win") {
      const profit = cashout - initialBet;
      totalProfit += profit;
      wins++;
    } else {
      totalProfit -= initialBet;
      losses++;
    }

    rounds.push({
      round: i + 1,
      multiplier,
      bet: initialBet,
      cashout,
      result,
      profit: result === "win" ? cashout - initialBet : -initialBet,
    });
  }

  return {
    strategy: "Fixed Cashout",
    totalRounds: multipliers.length,
    wins,
    losses,
    profitLoss: Math.round(totalProfit * 100) / 100,
    winRate: Math.round((wins / multipliers.length) * 100),
    rounds,
  };
}

/**
 * Generate a prediction based on historical data
 */
export function generatePrediction(multipliers: number[]): PredictionResult {
  if (multipliers.length === 0) {
    return {
      multiplier: 2.0,
      confidence: 0,
      reasoning: "No historical data available",
    };
  }

  const analysis = analyzeMultipliers(multipliers);
  const patterns = detectPatterns(multipliers);

  // Calculate probability of next round being >= 2.0x
  const highMultiplierProbability = analysis.highMultiplierPercentage / 100;

  // Adjust confidence based on patterns
  let confidence = Math.round(highMultiplierProbability * 100);
  let reasoning = `Based on ${analysis.totalRounds} rounds: ${analysis.highMultiplierPercentage}% were >= 2.0x`;

  // Detect rare patterns for higher confidence
  const rarePatterns = patterns.filter((p) => p.type === "consecutive_sub2x");
  if (rarePatterns.length > 0) {
    confidence = Math.min(confidence + 15, 95);
    reasoning += `. Rare pattern detected: ${rarePatterns[0].description}`;
  }

  return {
    multiplier: 2.0,
    confidence,
    reasoning,
  };
}
