import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";

const neonGreen = { color: "rgb(0 255 136)", textShadow: "0 0 10px rgba(0, 255, 136, 0.8)" };
const neonCyan = { color: "rgb(0 200 255)", textShadow: "0 0 10px rgba(0, 200, 255, 0.8)" };

export default function Analytics() {
  const { user } = useAuth();
  const { data: rounds = [] } = trpc.rounds.list.useQuery({});

  // Prepare data for charts
  const chartData = useMemo(() => {
    if (rounds.length === 0) return { trend: [], distribution: [] };

    // Trend data (last 20 rounds)
    const trend = rounds.slice(-20).map((round, idx) => ({
      round: idx + 1,
      multiplier: parseFloat(round.multiplier),
    }));

    // Distribution data (histogram)
    const multipliers = rounds.map((r) => parseFloat(r.multiplier));
    const bins = [
      { range: "0-1", count: 0 },
      { range: "1-2", count: 0 },
      { range: "2-3", count: 0 },
      { range: "3-5", count: 0 },
      { range: "5-10", count: 0 },
      { range: "10+", count: 0 },
    ];

    multipliers.forEach((m) => {
      if (m < 1) bins[0].count++;
      else if (m < 2) bins[1].count++;
      else if (m < 3) bins[2].count++;
      else if (m < 5) bins[3].count++;
      else if (m < 10) bins[4].count++;
      else bins[5].count++;
    });

    return { trend, distribution: bins };
  }, [rounds]);

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
          ANALYTICS
        </h1>

        <div className="space-y-8">
          {/* Trend Chart */}
          <Card className="glow-card">
            <h2 className="text-2xl font-bold mb-6 tracking-wider" style={neonGreen}>
              MULTIPLIER TREND (Last 20 Rounds)
            </h2>
            {chartData.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 136, 0.1)" />
                  <XAxis dataKey="round" stroke="rgb(0 200 255)" />
                  <YAxis stroke="rgb(0 200 255)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 10, 20, 0.9)",
                      border: "1px solid rgb(0 255 136)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="multiplier"
                    stroke="rgb(0 255 136)"
                    dot={{ fill: "rgb(0 200 255)" }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">No data available</div>
            )}
          </Card>

          {/* Distribution Chart */}
          <Card className="glow-card">
            <h2 className="text-2xl font-bold mb-6 tracking-wider" style={neonGreen}>
              MULTIPLIER DISTRIBUTION
            </h2>
            {chartData.distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 136, 0.1)" />
                  <XAxis dataKey="range" stroke="rgb(0 200 255)" />
                  <YAxis stroke="rgb(0 200 255)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 10, 20, 0.9)",
                      border: "1px solid rgb(0 255 136)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="rgb(0 255 136)" name="Frequency" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">No data available</div>
            )}
          </Card>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Total Rounds",
                value: rounds.length,
                color: neonGreen,
              },
              {
                label: "Average",
                value:
                  rounds.length > 0
                    ? (rounds.reduce((sum, r) => sum + parseFloat(r.multiplier), 0) / rounds.length).toFixed(2) + "x"
                    : "--",
                color: neonCyan,
              },
              {
                label: "Highest",
                value:
                  rounds.length > 0
                    ? Math.max(...rounds.map((r) => parseFloat(r.multiplier))).toFixed(2) + "x"
                    : "--",
                color: neonGreen,
              },
              {
                label: "Lowest",
                value:
                  rounds.length > 0
                    ? Math.min(...rounds.map((r) => parseFloat(r.multiplier))).toFixed(2) + "x"
                    : "--",
                color: neonCyan,
              },
            ].map((stat, idx) => (
              <Card key={idx} className="glow-card">
                <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                <p className="text-3xl font-bold" style={stat.color}>
                  {stat.value}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
