import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  level: "high" | "medium" | "low";
  score?: number;
  className?: string;
}

export function ConfidenceBadge({ level, score, className }: ConfidenceBadgeProps) {
  const variants = {
    high: "bg-green-500/20 text-green-400 border-green-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "macos-transition font-medium",
        variants[level],
        className
      )}
    >
      {level.toUpperCase()}
      {score !== undefined && ` (${Math.round(score * 100)}%)`}
    </Badge>
  );
}
