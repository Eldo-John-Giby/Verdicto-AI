import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="relative overflow-hidden bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all"
        aria-label="Toggle theme"
      >
        <motion.div
          initial={false}
          animate={{
            rotate: theme === "dark" ? 0 : 180,
            scale: theme === "dark" ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="absolute"
        >
          <Moon className="h-5 w-5 text-white" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            rotate: theme === "light" ? 0 : -180,
            scale: theme === "light" ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="absolute"
        >
          <Sun className="h-5 w-5 text-gray-900" />
        </motion.div>
      </Button>
    </motion.div>
  );
}
