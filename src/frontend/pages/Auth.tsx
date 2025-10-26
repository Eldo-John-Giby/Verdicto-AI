import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Scale, Mail, Lock, Shield, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AuthPageProps {
  redirectAfterAuth?: string;
}

export default function AuthPage({ redirectAfterAuth = "/dashboard" }: AuthPageProps) {
  const navigate = useNavigate();
  const { requestOTP, signIn, signInAsGuest, isAuthenticated } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate(redirectAfterAuth);
    return null;
  }

  const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!convexUrl) {
        throw new Error("Convex URL is not configured (VITE_CONVEX_URL).");
      }
      await requestOTP(email);
      toast.success("Verification code sent to your email");
      setStep("code");
    } catch (error: any) {
      const msg =
        error?.message ||
        error?.data?.message ||
        "Failed to send code";
      toast.error(msg);
      if (!convexUrl) {
        toast.error("Set VITE_CONVEX_URL in your frontend environment (Integrations → API Keys or your .env) to your Convex deployment URL.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!convexUrl) {
        throw new Error("Convex URL is not configured (VITE_CONVEX_URL).");
      }
      await signIn(email, code);
      toast.success("Successfully signed in!");
      navigate(redirectAfterAuth);
    } catch (error: any) {
      const msg =
        error?.message ||
        error?.data?.message ||
        "Invalid code";
      toast.error(msg);
      if (!convexUrl) {
        toast.error("Set VITE_CONVEX_URL in your frontend environment to your Convex deployment URL.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    try {
      if (!convexUrl) {
        throw new Error("Convex URL is not configured (VITE_CONVEX_URL).");
      }
      await signInAsGuest();
      toast.success("Signed in as guest");
      navigate(redirectAfterAuth);
    } catch (error: any) {
      const msg =
        error?.message ||
        error?.data?.message ||
        "Failed to sign in as guest";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Add: Convex URL warning banner */}
      {!convexUrl && (
        <div className="fixed top-6 left-6 right-6 z-50">
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
            VITE_CONVEX_URL is not set. Configure it to your Convex deployment URL (Integrations → API Keys). Auth will not work until this is set.
          </div>
        </div>
      )}

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="macos-card p-8">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex justify-center mb-8"
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Scale className="w-8 h-8 text-primary" />
            </div>
          </motion.div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light mb-2 text-foreground tracking-tight">
              Welcome to Verdicto
            </h1>
            <p className="text-muted-foreground font-light">
              {step === "email" ? "Enter your email to continue" : "Enter the verification code"}
            </p>
          </div>

          {/* Form */}
          {step === "email" ? (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Continue with Email"}
              </Button>

              {/* Guest Sign In */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGuestSignIn}
                disabled={isLoading}
              >
                <UserCircle className="h-5 w-5 mr-2" />
                {isLoading ? "Signing in..." : "Continue as Guest"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Verification Code</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="pl-10"
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Check your email for the 6-digit code
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep("email")}
              >
                Back to email
              </Button>
            </form>
          )}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 pt-6 border-t border-border/50"
          >
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Secure authentication powered by email OTP</span>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}