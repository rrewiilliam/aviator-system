import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Predictor from "@/pages/Predictor";
import Verifier from "@/pages/Verifier";
import History from "@/pages/History";
import Analytics from "@/pages/Analytics";
import Strategy from "@/pages/Strategy";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/predictor"} component={Predictor} />
      <Route path={"/verifier"} component={Verifier} />
      <Route path={"/history"} component={History} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/strategy"} component={Strategy} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
