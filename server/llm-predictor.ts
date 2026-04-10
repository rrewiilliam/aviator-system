import { invokeLLM } from "./_core/llm";
import { analyzeMultipliers, detectPatterns } from "./prediction-engine";

export interface LLMPredictionSummary {
  summary: string;
  riskAssessment: string;
  recommendedCashout: number;
  confidence: number;
}

/**
 * Generate an LLM-powered prediction summary based on multiplier history
 */
export async function generateLLMPredictionSummary(
  multipliers: number[],
  lastN: number = 20
): Promise<LLMPredictionSummary> {
  if (multipliers.length === 0) {
    return {
      summary: "No historical data available for analysis.",
      riskAssessment: "Unable to assess risk without data.",
      recommendedCashout: 2.0,
      confidence: 0,
    };
  }

  // Use last N multipliers for analysis
  const recentMultipliers = multipliers.slice(-lastN);
  const analysis = analyzeMultipliers(recentMultipliers);
  const patterns = detectPatterns(recentMultipliers);

  // Prepare context for LLM
  const multipliersList = recentMultipliers.map((m) => m.toFixed(2)).join(", ");
  const patternDescriptions = patterns
    .map((p) => `${p.type}: ${p.description} (confidence: ${p.confidence}%)`)
    .join("\n");

  const prompt = `You are an expert Aviator game analyst. Based on the following game history and statistical analysis, provide a brief prediction summary.

Game Multipliers (last ${recentMultipliers.length} rounds):
${multipliersList}

Statistical Analysis:
- Average Multiplier: ${analysis.averageMultiplier}x
- Median Multiplier: ${analysis.medianMultiplier}x
- Min: ${analysis.minMultiplier}x, Max: ${analysis.maxMultiplier}x
- Standard Deviation: ${analysis.standardDeviation}
- Low Multiplier Percentage (<2x): ${analysis.lowMultiplierPercentage}%
- High Multiplier Percentage (≥2x): ${analysis.highMultiplierPercentage}%

Detected Patterns:
${patternDescriptions || "No significant patterns detected"}

Please provide:
1. A brief 1-2 sentence summary of the current game state
2. A risk assessment (Low/Medium/High) with reasoning
3. A recommended cashout target for the next round (e.g., 2.0x, 3.0x)
4. Your confidence level (0-100) in this prediction

Format your response as JSON with keys: summary, riskAssessment, recommendedCashout, confidence`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert Aviator game analyst. Provide concise, data-driven predictions based on game history and patterns.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "prediction_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description: "Brief summary of the current game state",
              },
              riskAssessment: {
                type: "string",
                description: "Risk assessment (Low/Medium/High) with reasoning",
              },
              recommendedCashout: {
                type: "number",
                description: "Recommended cashout target (e.g., 2.0, 3.0)",
              },
              confidence: {
                type: "integer",
                description: "Confidence level 0-100",
              },
            },
            required: ["summary", "riskAssessment", "recommendedCashout", "confidence"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }

    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || "Unable to generate summary",
      riskAssessment: parsed.riskAssessment || "Unable to assess risk",
      recommendedCashout: Math.max(1.0, parsed.recommendedCashout || 2.0),
      confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
    };
  } catch (error: unknown) {
    console.error("LLM prediction error:", error);
    // Fallback to statistical prediction
    return {
      summary: `Recent average multiplier is ${analysis.averageMultiplier}x with ${analysis.highMultiplierPercentage}% high-value rounds.`,
      riskAssessment:
        analysis.highMultiplierPercentage > 60 ? "Low" : analysis.highMultiplierPercentage > 40 ? "Medium" : "High",
      recommendedCashout: analysis.averageMultiplier > 3.0 ? 3.0 : 2.0,
      confidence: 50,
    };
  }
}

/**
 * Check for rare patterns and generate owner notification
 */
export function checkForRarePatterns(
  multipliers: number[]
): { shouldNotify: boolean; message: string; pattern: string | null } {
  if (multipliers.length < 5) {
    return { shouldNotify: false, message: "", pattern: null };
  }

  const patterns = detectPatterns(multipliers);

  // Check for 5+ consecutive sub-2x rounds (rare pattern)
  const consecutiveSub2x = patterns.find(
    (p) => p.type === "consecutive_sub2x" && p.roundCount >= 5 && p.confidence >= 70
  );

  if (consecutiveSub2x) {
    return {
      shouldNotify: true,
      message: `RARE PATTERN DETECTED: ${consecutiveSub2x.roundCount} consecutive rounds below 2.0x (confidence: ${consecutiveSub2x.confidence}%)`,
      pattern: "consecutive_sub2x",
    };
  }

  // Check for high-confidence hot streaks
  const hotStreak = patterns.find((p) => p.type === "hotStreak" && p.confidence >= 80);
  if (hotStreak) {
    return {
      shouldNotify: true,
      message: `HOT STREAK DETECTED: ${hotStreak.roundCount} consecutive high multiplier rounds (confidence: ${hotStreak.confidence}%)`,
      pattern: "hotStreak",
    };
  }

  return { shouldNotify: false, message: "", pattern: null };
}
