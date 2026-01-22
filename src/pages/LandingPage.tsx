import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, TrendingUp, Brain, Zap } from "lucide-react";

function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Hero Section */}
      <div className="text-center space-y-8 max-w-4xl">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted border-2 border-foreground">
            <Sparkles className="w-10 h-10 text-foreground" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">AI-Powered Budget App</h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Take control of your finances with intelligent transaction categorization and
            personalized financial insights
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/signup">
            <Button variant="primary" size="lg">
              Get Started Free
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">
              Log In
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-lg bg-card border border-border hover:border-foreground hover:bg-muted">
            <Brain className="w-12 h-12 text-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Smart Categorization</h3>
            <p className="text-sm text-muted-foreground">
              AI automatically categorizes your transactions, learning from your patterns over time
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-lg bg-card border border-border hover:border-foreground hover:bg-muted">
            <TrendingUp className="w-12 h-12 text-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Financial Insights</h3>
            <p className="text-sm text-muted-foreground">
              Visualize spending patterns, track goals, and get a comprehensive financial health
              score
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-lg bg-card border border-border hover:border-foreground hover:bg-muted">
            <Zap className="w-12 h-12 text-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Fast & Simple</h3>
            <p className="text-sm text-muted-foreground">
              Paste bank statements for instant import, or chat with AI to manage your finances
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
