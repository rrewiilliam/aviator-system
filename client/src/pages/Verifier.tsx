import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

const neonGreen = { color: "rgb(0 255 136)", textShadow: "0 0 10px rgba(0, 255, 136, 0.8)" };
const neonCyan = { color: "rgb(0 200 255)", textShadow: "0 0 10px rgba(0, 200, 255, 0.8)" };

export default function Verifier() {
  const { user } = useAuth();
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [nonce, setNonce] = useState("0");
  const [mode, setMode] = useState<"simulate" | "verify">("simulate");
  const [expectedMultiplier, setExpectedMultiplier] = useState("");

  const simulateQuery = trpc.verifier.simulate.useQuery(
    { serverSeed, clientSeed, nonce: parseInt(nonce) },
    { enabled: mode === "simulate" && !!serverSeed && !!clientSeed }
  );

  const verifyQuery = trpc.verifier.verify.useQuery(
    { serverSeed, clientSeed, nonce: parseInt(nonce), expectedMultiplier },
    { enabled: mode === "verify" && !!serverSeed && !!clientSeed && !!expectedMultiplier }
  );

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
          PROVABLY FAIR VERIFIER
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-8">
            {/* Mode Selector */}
            <Card className="glow-card">
              <div className="flex gap-4 mb-6">
            <Button
              onClick={() => setMode("simulate")}
              className={mode === "simulate" ? "btn-glow" : "px-4 py-2 border border-primary/30 rounded text-foreground"}
            >
              Simulate
            </Button>
            <Button
              onClick={() => setMode("verify")}
              className={mode === "verify" ? "btn-glow" : "px-4 py-2 border border-primary/30 rounded text-foreground"}
            >
              Verify
            </Button>
              </div>

              {/* Input Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2" style={neonGreen}>
                    Server Seed (SHA-512 Hash)
                  </label>
                  <Input
                    value={serverSeed}
                    onChange={(e) => setServerSeed(e.target.value)}
                    placeholder="Enter server seed hash"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={neonGreen}>
                    Client Seed
                  </label>
                  <Input
                    value={clientSeed}
                    onChange={(e) => setClientSeed(e.target.value)}
                    placeholder="Enter client seed"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={neonGreen}>
                    Nonce
                  </label>
                  <Input
                    type="number"
                    value={nonce}
                    onChange={(e) => setNonce(e.target.value)}
                    placeholder="0"
                    className="w-full"
                  />
                </div>

                {mode === "verify" && (
                  <div>
                    <label className="block text-sm font-bold mb-2" style={neonGreen}>
                      Expected Multiplier
                    </label>
                    <Input
                      value={expectedMultiplier}
                      onChange={(e) => setExpectedMultiplier(e.target.value)}
                      placeholder="e.g., 2.45"
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Results */}
            {mode === "simulate" && simulateQuery.data && (
              <Card className="glow-card">
                <h2 className="text-2xl font-bold mb-4 tracking-wider" style={neonGreen}>
                  SIMULATION RESULT
                </h2>
                <div className="bg-background/50 p-6 rounded border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Calculated Multiplier</p>
                  <p className="text-5xl font-bold" style={neonCyan}>
                    {simulateQuery.data.multiplier}x
                  </p>
                </div>
              </Card>
            )}

            {mode === "verify" && verifyQuery.data && (
              <Card className={verifyQuery.data.isValid ? "glow-card" : "glow-card"}>
                <h2 className="text-2xl font-bold mb-4 tracking-wider" style={neonGreen}>
                  VERIFICATION RESULT
                </h2>
                <div className="space-y-4">
                  <div className="bg-background/50 p-4 rounded border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Calculated Multiplier</p>
                    <p className="text-3xl font-bold" style={neonCyan}>
                      {verifyQuery.data.multiplier}x
                    </p>
                  </div>
                  <div className="bg-background/50 p-4 rounded border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Status</p>
                    <p
                      className="text-2xl font-bold"
                      style={verifyQuery.data.isValid ? neonGreen : { color: "rgb(255 0 100)" }}
                    >
                      {verifyQuery.data.isValid ? "✓ VALID" : "✗ INVALID"}
                    </p>
                  </div>
                  <div className="bg-background/50 p-4 rounded border border-primary/20 break-all">
                    <p className="text-sm text-muted-foreground mb-2">Hash</p>
                    <p className="text-xs font-mono text-muted-foreground">{verifyQuery.data.hash}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="cyan-card">
              <h3 className="text-lg font-bold mb-4 tracking-wider" style={neonCyan}>
                HOW IT WORKS
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong style={neonGreen}>Simulate:</strong> Calculate the crash point from seeds
                </p>
                <p>
                  <strong style={neonGreen}>Verify:</strong> Check if a multiplier matches the seeds
                </p>
                <p className="text-xs text-muted-foreground/70 mt-4">
                  Uses SHA-512 based Aviator algorithm for cryptographic verification.
                </p>
              </div>
            </Card>

            <Card className="glow-card">
              <h3 className="text-lg font-bold mb-4 tracking-wider" style={neonGreen}>
                EXAMPLE
              </h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <strong>Server:</strong>
                  <br />
                  abc123...
                </p>
                <p>
                  <strong>Client:</strong>
                  <br />
                  test_seed
                </p>
                <p>
                  <strong>Nonce:</strong>
                  <br />
                  0
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
