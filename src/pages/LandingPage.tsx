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
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4">
      {/* Hero Section */}
      <div className="text-center space-y-8 max-w-4xl">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-600/20 border-2 border-blue-600">
            <Sparkles className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white">AI-Powered Budget App</h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto">
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
          <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors">
            <Brain className="w-12 h-12 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Smart Categorization</h3>
            <p className="text-sm text-gray-400">
              AI automatically categorizes your transactions, learning from your patterns over time
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors">
            <TrendingUp className="w-12 h-12 text-green-500" />
            <h3 className="text-lg font-semibold text-white">Financial Insights</h3>
            <p className="text-sm text-gray-400">
              Visualize spending patterns, track goals, and get a comprehensive financial health
              score
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors">
            <Zap className="w-12 h-12 text-yellow-500" />
            <h3 className="text-lg font-semibold text-white">Fast & Simple</h3>
            <p className="text-sm text-gray-400">
              Paste bank statements for instant import, or chat with AI to manage your finances
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
