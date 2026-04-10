import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";

const neonGreen = { color: "rgb(0 255 136)", textShadow: "0 0 10px rgba(0, 255, 136, 0.8)" };
const neonCyan = { color: "rgb(0 200 255)", textShadow: "0 0 10px rgba(0, 200, 255, 0.8)" };

export default function History() {
  const { user } = useAuth();
  const [minMultiplier, setMinMultiplier] = useState("");
  const [maxMultiplier, setMaxMultiplier] = useState("");

  const { data: rounds = [], isLoading } = trpc.rounds.list.useQuery({});

  const filteredRounds = useMemo(() => {
    if (!rounds) return [];
    return rounds.filter((round) => {
      const mult = parseFloat(round.multiplier);
      const min = minMultiplier ? parseFloat(minMultiplier) : 0;
      const max = maxMultiplier ? parseFloat(maxMultiplier) : Infinity;
      return mult >= min && mult <= max;
    });
  }, [rounds, minMultiplier, maxMultiplier]);

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
          ROUND HISTORY
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-3">
            <Card className="glow-card">
              <h2 className="text-2xl font-bold mb-6 tracking-wider" style={neonGreen}>
                PAST ROUNDS ({filteredRounds.length})
              </h2>

              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading rounds...</p>
                </div>
              ) : filteredRounds.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No rounds found. Import game history to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary/20">
                        <th className="text-left py-3 px-4" style={neonGreen}>
                          #
                        </th>
                        <th className="text-left py-3 px-4" style={neonGreen}>
                          Multiplier
                        </th>
                        <th className="text-left py-3 px-4" style={neonGreen}>
                          Date
                        </th>
                        <th className="text-left py-3 px-4" style={neonGreen}>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRounds.map((round, idx) => (
                        <tr key={round.id} className="border-b border-primary/10 hover:bg-background/50">
                          <td className="py-3 px-4 text-muted-foreground">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <span style={neonCyan} className="font-bold">
                              {round.multiplier}x
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">
                            {new Date(round.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className="text-xs px-2 py-1 rounded"
                              style={{
                                backgroundColor: "rgba(0, 255, 136, 0.1)",
                                color: "rgb(0 255 136)",
                              }}
                            >
                              Recorded
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Filters */}
            <Card className="cyan-card">
              <h3 className="text-lg font-bold mb-4 tracking-wider" style={neonCyan}>
                FILTER
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-2" style={neonGreen}>
                    Min Multiplier
                  </label>
                  <Input
                    type="number"
                    value={minMultiplier}
                    onChange={(e) => setMinMultiplier(e.target.value)}
                    placeholder="e.g., 1.0"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2" style={neonGreen}>
                    Max Multiplier
                  </label>
                  <Input
                    type="number"
                    value={maxMultiplier}
                    onChange={(e) => setMaxMultiplier(e.target.value)}
                    placeholder="e.g., 10.0"
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={() => {
                    setMinMultiplier("");
                    setMaxMultiplier("");
                  }}
                  className="w-full btn-glow text-sm"
                >
                  RESET
                </Button>
              </div>
            </Card>

            {/* Stats */}
            <Card className="glow-card">
              <h3 className="text-lg font-bold mb-4 tracking-wider" style={neonGreen}>
                STATS
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Rounds:</span>
                  <span style={neonCyan}>{rounds?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Filtered:</span>
                  <span style={neonCyan}>{filteredRounds.length}</span>
                </div>
                {filteredRounds.length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg:</span>
                      <span style={neonGreen}>
                        {(
                          filteredRounds.reduce((sum, r) => sum + parseFloat(r.multiplier), 0) /
                          filteredRounds.length
                        ).toFixed(2)}
                        x
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max:</span>
                      <span style={neonGreen}>
                        {Math.max(...filteredRounds.map((r) => parseFloat(r.multiplier))).toFixed(2)}x
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min:</span>
                      <span style={neonGreen}>
                        {Math.min(...filteredRounds.map((r) => parseFloat(r.multiplier))).toFixed(2)}x
                      </span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
