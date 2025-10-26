import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export function DisclaimerBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 macos-card border-t border-border/50 p-3"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
        <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
        <p className="text-muted-foreground">
          <strong className="text-foreground">Disclaimer:</strong> This tool is for informational purposes only and does not constitute legal advice. Always consult with a qualified legal professional.
        </p>
      </div>
    </motion.div>
  );
}
