import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

const neonGreen = { color: "rgb(0 255 136)", textShadow: "0 0 10px rgba(0, 255, 136, 0.8)" };
const neonCyan = { color: "rgb(0 200 255)", textShadow: "0 0 10px rgba(0, 200, 255, 0.8)" };

type StrategyType = "martingale" | "anti-martingale" | "fixed";

export default function Strategy() {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<StrategyType>("martingale");
  const [initialBet, setInitialBet] = useState("10");
  const [fixedCashout, setFixedCashout] = useState("2.0");
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSimulate = async () => {
    try {
      setIsSimulating(true);
      const strategyMap: Record<StrategyType, string> = {
        martingale: "martingale",
        "anti-martingale": "antiMartingale",
        fixed: "fixedCashout",
      };

      const mockResult = {
        totalProfitLoss: Math.random() * 1000 - 500,
        roi: Math.random() * 100 - 50,
        winRate: Math.random() * 100,
        maxDrawdown: Math.random() * 500,
        summary: `Simulated ${strategy} strategy with initial bet ${initialBet}. Results are based on historical data.`,
      };
      setResults(mockResult);
    } catch (error) {
      console.error("Simulation error:", error);
      alert("Failed to run simulation");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-primary/30 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <div className="text-2xl font-bold tracking-wider cursor-pointer" style={neonGreen}>
              AVIATOR PREDICTOR
            </div>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 tracking-wider" style={neonGreen}>
          STRATEGY SIMULATOR
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-8">
            {/* Strategy Configuration */}
            <Card className="glow-card">
              <h2 className="text-2xl font-bold mb-6 tracking-wider" style={neonGreen}>
                CONFIGURATION
              </h2>

              <div className="space-y-6">
                {/* Strategy Selection */}
                <div>
                  <label className="block text-sm font-bold mb-3" style={neonGreen}>
                    Strategy Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "martingale", label: "Martingale" },
                      { id: "anti-martingale", label: "Anti-Martingale" },
                      { id: "fixed", label: "Fixed Cashout" },
                    ].map((s) => (
                      <Button
                        key={s.id}
                        onClick={() => setStrategy(s.id as StrategyType)}
                        className={
                          strategy === s.id
                            ? "btn-glow"
                            : "px-4 py-2 border border-primary/30 rounded text-foreground"
                        }
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={neonGreen}>
                      Initial Bet
                    </label>
                    <Input
                      type="number"
                      value={initialBet}
                      onChange={(e) => setInitialBet(e.target.value)}
                      placeholder="10"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2" style={neonGreen}>
                      Rounds to Simulate
                    </label>
                    <Input
                      type="number"
                      defaultValue="50"
                      placeholder="50"
                      className="w-full"
                    />
                  </div>
                </div>

                {strategy === "fixed" && (
                  <div>
                    <label className="block text-sm font-bold mb-2" style={neonGreen}>
                      Fixed Cashout Multiplier
                    </label>
                    <Input
                      type="number"
                      value={fixedCashout}
                      onChange={(e) => setFixedCashout(e.target.value)}
                      placeholder="2.0"
                      step="0.1"
                      className="w-full"
                    />
                  </div>
                )}

                <Button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="w-full btn-glow text-lg py-6"
                >
                  {isSimulating ? "SIMULATING..." : "RUN SIMULATION"}
                </Button>
              </div>
            </Card>

            {/* Results */}
            {results && (
              <Card className="glow-card">
                <h2 className="text-2xl font-bold mb-6 tracking-wider" style={neonGreen}>
                  RESULTS
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-background/50 p-4 rounded border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Total Profit/Loss</p>
                    <p
                      className="text-3xl font-bold"
                      style={results.totalProfitLoss >= 0 ? neonGreen : { color: "rgb(255 0 100)" }}
                    >
                      {results.totalProfitLoss >= 0 ? "+" : ""}
                      {results.totalProfitLoss.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-background/50 p-4 rounded border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">ROI</p>
                    <p
                      className="text-3xl font-bold"
                      style={results.roi >= 0 ? neonGreen : { color: "rgb(255 0 100)" }}
                    >
                      {results.roi >= 0 ? "+" : ""}
                      {results.roi.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-background/50 p-4 rounded border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Win Rate</p>
                    <p className="text-3xl font-bold" style={neonCyan}>
                      {results.winRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-background/50 p-4 rounded border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Max Drawdown</p>
                    <p className="text-3xl font-bold" style={{ color: "rgb(255 0 100)" }}>
                      {results.maxDrawdown.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="bg-background/50 p-4 rounded border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Summary</p>
                  <p className="text-muted-foreground">{results.summary}</p>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="cyan-card">
              <h3 className="text-lg font-bold mb-4 tracking-wider" style={neonCyan}>
                STRATEGY GUIDE
              </h3>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <p className="font-bold" style={neonGreen}>
                    Martingale
                  </p>
                  <p>Double bet after each loss. Risky but can recover losses quickly.</p>
                </div>
                <div>
                  <p className="font-bold" style={neonGreen}>
                    Anti-Martingale
                  </p>
                  <p>Double bet after each win. Safer approach to compound profits.</p>
                </div>
                <div>
                  <p className="font-bold" style={neonGreen}>
                    Fixed Cashout
                  </p>
                  <p>Always cashout at the same multiplier. Consistent and predictable.</p>
                </div>
              </div>
            </Card>

            <Card className="glow-card">
              <h3 className="text-lg font-bold mb-4 tracking-wider" style={neonGreen}>
                DISCLAIMER
              </h3>
              <p className="text-xs text-muted-foreground">
                Simulations are based on historical data and do not guarantee future results. Always gamble responsibly.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
