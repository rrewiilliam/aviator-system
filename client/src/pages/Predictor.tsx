import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

const neonGreen = { color: "rgb(0 255 136)", textShadow: "0 0 10px rgba(0, 255, 136, 0.8)" };
const neonCyan = { color: "rgb(0 200 255)", textShadow: "0 0 10px rgba(0, 200, 255, 0.8)" };

export default function Predictor() {
  const { user } = useAuth();
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const { data: analysis, isLoading } = trpc.predictor.analyze.useQuery();
  const importMutation = trpc.rounds.import.useMutation();

  const handleImport = async () => {
    try {
      setIsImporting(true);
      const multipliers = importText
        .split("\n")
        .map((line) => parseFloat(line.trim()))
        .filter((m) => !isNaN(m));

      if (multipliers.length === 0) {
        alert("No valid multipliers found");
        return;
      }

      await importMutation.mutateAsync({ multipliers });
      setImportText("");
      alert(`Imported ${multipliers.length} rounds`);
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import data");
    } finally {
      setIsImporting(false);
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
          <div className="flex items-center gap-4">
            <span className="text-sm" style={neonCyan}>
              {user?.name}
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 tracking-wider" style={neonGreen}>
          LIVE PREDICTOR
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-8">
            {/* Analysis Results */}
            {isLoading ? (
              <Card className="glow-card flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" style={neonGreen} />
              </Card>
            ) : analysis ? (
              <>
                {/* Prediction */}
                {analysis.prediction && (
                  <Card className="glow-card">
                    <h2 className="text-2xl font-bold mb-4 tracking-wider" style={neonGreen}>
                      PREDICTION
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-background/50 rounded-full h-3 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-cyan-500"
                              style={{ width: `${analysis.prediction.confidence}%` }}
                            />
                          </div>
                          <span className="text-xl font-bold" style={neonGreen}>
                            {analysis.prediction.confidence}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Recommended Cashout</p>
                        <p className="text-3xl font-bold" style={neonCyan}>
                          {analysis.prediction.multiplier}x
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Analysis</p>
                        <p className="text-muted-foreground">{analysis.prediction.reasoning}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Statistics */}
                {analysis.analysis && (
                  <Card className="glow-card">
                    <h2 className="text-2xl font-bold mb-4 tracking-wider" style={neonGreen}>
                      STATISTICS
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background/50 p-4 rounded border border-primary/20">
                        <p className="text-xs text-muted-foreground">Average</p>
                        <p className="text-2xl font-bold" style={neonGreen}>
                          {analysis.analysis.averageMultiplier.toFixed(2)}x
                        </p>
                      </div>
                      <div className="bg-background/50 p-4 rounded border border-primary/20">
                        <p className="text-xs text-muted-foreground">Median</p>
                        <p className="text-2xl font-bold" style={neonCyan}>
                          {analysis.analysis.medianMultiplier.toFixed(2)}x
                        </p>
                      </div>
                      <div className="bg-background/50 p-4 rounded border border-primary/20">
                        <p className="text-xs text-muted-foreground">High %</p>
                        <p className="text-2xl font-bold" style={neonGreen}>
                          {analysis.analysis.highMultiplierPercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-background/50 p-4 rounded border border-primary/20">
                        <p className="text-xs text-muted-foreground">Std Dev</p>
                        <p className="text-2xl font-bold" style={neonCyan}>
                          {analysis.analysis.standardDeviation.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Patterns */}
                {analysis.patterns && analysis.patterns.length > 0 && (
                  <Card className="glow-card">
                    <h2 className="text-2xl font-bold mb-4 tracking-wider" style={neonGreen}>
                      PATTERNS DETECTED
                    </h2>
                    <div className="space-y-3">
                      {analysis.patterns.map((pattern, idx) => (
                        <div key={idx} className="bg-background/50 p-3 rounded border border-primary/20">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold" style={neonGreen}>
                                {pattern.type}
                              </p>
                              <p className="text-sm text-muted-foreground">{pattern.description}</p>
                            </div>
                            <span className="text-sm font-bold" style={neonCyan}>
                              {pattern.confidence}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="glow-card text-center py-12">
                <p className="text-muted-foreground mb-4">No data available. Import game history to see predictions.</p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Import Data */}
            <Card className="cyan-card">
              <h3 className="text-xl font-bold mb-4 tracking-wider" style={neonCyan}>
                IMPORT DATA
              </h3>
              <div className="space-y-3">
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste multipliers (one per line)&#10;e.g.&#10;2.45&#10;1.23&#10;5.67"
                  className="w-full h-32 bg-input text-foreground border border-primary/30 rounded p-3 text-sm"
                />
                <Button
                  onClick={handleImport}
                  disabled={isImporting || !importText.trim()}
                  className="w-full btn-glow"
                >
                  {isImporting ? "Importing..." : "IMPORT"}
                </Button>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="glow-card">
              <h3 className="text-lg font-bold mb-4 tracking-wider" style={neonGreen}>
                ACTIONS
              </h3>
              <div className="space-y-3">
                <Link href="/verifier" className="block">
                  <Button className="w-full btn-glow justify-center">Verify Round</Button>
                </Link>
                <Link href="/analytics" className="block">
                  <Button className="w-full btn-glow justify-center">View Charts</Button>
                </Link>
                <Link href="/strategy" className="block">
                  <Button className="w-full btn-glow justify-center">Test Strategy</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
