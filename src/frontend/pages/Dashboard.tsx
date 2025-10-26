import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, FileStack, Search, AlertTriangle, FileText, HistoryIcon, Radio, FilePenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoDropdown } from "@/components/LogoDropdown";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const currentUser = useQuery(api.users.currentUser);

  const navItems = [
    { id: "prediction", label: "Case Prediction", icon: Scale, path: "/dashboard" },
    { id: "generator", label: "Document Generator", icon: FilePenLine, path: "/dashboard/generator" },
    { id: "documents", label: "Document Library", icon: FileStack, path: "/dashboard/documents" },
    { id: "timeline", label: "Legal Timeline", icon: HistoryIcon, path: "/dashboard/timeline" },
    { id: "comparison", label: "Document Comparison", icon: FileText, path: "/dashboard/comparison" },
    { id: "research", label: "Legal Research", icon: Search, path: "/dashboard/research" },
    { id: "bias", label: "Bias Insights", icon: AlertTriangle, path: "/dashboard/bias" },
    { id: "reports", label: "Reports", icon: FileText, path: "/dashboard/reports" },
    { id: "history", label: "History", icon: HistoryIcon, path: "/dashboard/history" },
    { id: "live-verdict", label: "Live Verdict", icon: Radio, path: "/dashboard/live-verdict" },
    { id: "live-verdict-history", label: "Live Verdict History", icon: HistoryIcon, path: "/dashboard/live-verdict-history" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-72 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col"
      >
        {/* Logo & App Name */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <LogoDropdown />
            <h1 className="text-2xl font-light tracking-tight text-foreground">LexAI UI</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.id}
                onClick={() => navigate(item.path)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <Card className="p-4 bg-background/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {currentUser?.name?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {currentUser?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUser?.email || ""}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Sign Out
            </Button>
          </Card>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}