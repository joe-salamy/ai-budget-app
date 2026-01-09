import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { Chrome } from "lucide-react";

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, resetPassword, user, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // Clear errors when inputs change
  useEffect(() => {
    clearError();
    setFormErrors({});
  }, [email, password]);

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password && !showForgotPassword) {
      errors.password = "Password is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(email, password);
      // Redirect will happen via useEffect when user state updates
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      setFormErrors({ email: "Please enter your email address" });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormErrors({ email: "Please enter a valid email address" });
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(email);
      setResetEmailSent(true);
    } catch (err) {
      console.error("Password reset error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      // Redirect will happen automatically via OAuth
    } catch (err) {
      console.error("Google sign in error:", err);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">
            {showForgotPassword ? "Reset Password" : "Welcome Back"}
          </h1>
          <p className="text-gray-400">
            {showForgotPassword
              ? "Enter your email to receive a password reset link"
              : "Sign in to your account"}
          </p>
        </div>

        {/* Login/Reset Password Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>{showForgotPassword ? "Forgot Password" : "Log In"}</CardTitle>
            <CardDescription>
              {showForgotPassword
                ? "We'll send you a link to reset your password"
                : "Enter your credentials to continue"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {showForgotPassword ? (
              // Forgot Password Form
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Input
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={formErrors.email}
                  fullWidth
                  disabled={isSubmitting || resetEmailSent}
                  autoComplete="email"
                  required
                />

                {error && (
                  <div className="p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {resetEmailSent && (
                  <div className="p-3 rounded-lg bg-green-900/20 border border-green-800 text-green-400 text-sm">
                    Password reset email sent! Check your inbox.
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                  disabled={isSubmitting || resetEmailSent}
                >
                  Send Reset Link
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmailSent(false);
                    clearError();
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300 w-full text-center"
                >
                  ← Back to login
                </button>
              </form>
            ) : (
              // Login Form
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={formErrors.email}
                  fullWidth
                  disabled={isSubmitting}
                  autoComplete="email"
                  required
                />

                <Input
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={formErrors.password}
                  fullWidth
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  required
                />

                {error && (
                  <div className="p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Sign In
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                >
                  <Chrome className="w-5 h-5 mr-2" />
                  Sign in with Google
                </Button>
              </form>
            )}
          </CardContent>

          {!showForgotPassword && (
            <CardFooter>
              <p className="text-sm text-gray-400 text-center w-full">
                Don't have an account?{" "}
                <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          )}
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-300">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
