import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import AnimatedPlane from "@/components/AnimatedPlane";

const neonGreen = { color: "rgb(0 255 136)", textShadow: "0 0 10px rgba(0, 255, 136, 0.8)" };
const neonCyan = { color: "rgb(0 200 255)", textShadow: "0 0 10px rgba(0, 200, 255, 0.8)" };

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4" style={neonGreen} />
          <p className="text-xl" style={neonGreen}>
            Loading Aviator Predictor...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Navigation */}
        <nav className="border-b border-primary/30 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold tracking-wider" style={neonGreen}>
              AVIATOR PREDICTOR
            </div>
            <Button onClick={() => (window.location.href = getLoginUrl())} className="btn-glow">
              Sign In
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Animated Plane */}
            <div className="flex justify-center">
              <AnimatedPlane multiplier={2.45} isFlying={true} className="w-full" />
            </div>

            {/* Right: Hero Text */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold mb-4 tracking-wider" style={neonGreen}>
                  MASTER THE SKIES
                </h1>
                <p className="text-xl text-muted-foreground mb-6">
                  Advanced AI-powered analytics and prediction engine for Aviator game strategy.
                  Make data-driven decisions with real-time insights and pattern recognition.
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="btn-glow w-full text-lg py-6"
                >
                  START PREDICTING NOW
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Free access to all features. No credit card required.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-card/30 backdrop-blur-sm border-t border-b border-primary/20 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16 tracking-wider" style={neonGreen}>
              CORE FEATURES
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, idx) => (
                <Card key={idx} className="glow-card">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3 tracking-wider" style={neonGreen}>
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl font-bold mb-8 tracking-wider" style={neonGreen}>
            READY TO PREDICT?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of players using AI-powered analytics to improve their Aviator strategy.
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="btn-glow text-lg py-6 px-12"
          >
            GET STARTED FREE
          </Button>
        </div>
      </div>
    );
  }

  // Authenticated view
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-primary/30 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold tracking-wider" style={neonGreen}>
            AVIATOR PREDICTOR
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={neonCyan}>
              Welcome, {user?.name || "Player"}
            </span>
            <Link href="/dashboard" className="text-primary hover:text-primary/80">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="glow-card">
              <h2 className="text-3xl font-bold mb-6 tracking-wider" style={neonGreen}>
                LIVE PREDICTOR
              </h2>
              <AnimatedPlane multiplier={1.85} isFlying={true} />
            </Card>

            <Card className="glow-card">
              <h3 className="text-2xl font-bold mb-4 tracking-wider" style={neonGreen}>
                QUICK STATS
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/50 p-4 rounded border border-primary/20">
                  <p className="text-sm text-muted-foreground">Total Rounds</p>
                  <p className="text-3xl font-bold" style={neonGreen}>
                    --
                  </p>
                </div>
                <div className="bg-background/50 p-4 rounded border border-primary/20">
                  <p className="text-sm text-muted-foreground">Avg Multiplier</p>
                  <p className="text-3xl font-bold" style={neonCyan}>
                    --
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="cyan-card">
              <h3 className="text-xl font-bold mb-4 tracking-wider" style={neonCyan}>
                NAVIGATION
              </h3>
              <div className="space-y-3">
                <Link href="/predictor" className="block">
                  <Button className="w-full btn-glow justify-start">Dashboard</Button>
                </Link>
                <Link href="/verifier" className="block">
                  <Button className="w-full btn-glow justify-start">Verifier</Button>
                </Link>
                <Link href="/history" className="block">
                  <Button className="w-full btn-glow justify-start">History</Button>
                </Link>
                <Link href="/analytics" className="block">
                  <Button className="w-full btn-glow justify-start">Analytics</Button>
                </Link>
                <Link href="/strategy" className="block">
                  <Button className="w-full btn-glow justify-start">Strategy</Button>
                </Link>
              </div>
            </Card>

            <Card className="glow-card">
              <h3 className="text-lg font-bold mb-3 tracking-wider" style={neonGreen}>
                TIP
              </h3>
              <p className="text-sm text-muted-foreground">
                Import your game history to unlock advanced analytics and AI predictions.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: "📊",
    title: "Live Predictor",
    description: "Real-time statistical probability scores and streak detection based on game history.",
  },
  {
    icon: "✓",
    title: "Provably Fair Verifier",
    description: "Verify Aviator rounds using SHA-512 algorithm with seed verification.",
  },
  {
    icon: "📈",
    title: "Historical Tracking",
    description: "Log and analyze past multipliers with advanced filtering and date ranges.",
  },
  {
    icon: "📉",
    title: "Analytics & Charts",
    description: "Interactive Recharts visualizations showing multiplier trends and distributions.",
  },
  {
    icon: "🎯",
    title: "Pattern Recognition",
    description: "Detect rainbow patterns, hot/cold streaks, and rare game sequences.",
  },
  {
    icon: "🎮",
    title: "Strategy Simulator",
    description: "Test Martingale, Anti-Martingale, and fixed cashout strategies.",
  },
];
