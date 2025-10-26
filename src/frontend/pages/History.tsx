import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Clock, MessageSquare } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";

export default function History() {
  const queries = useQuery(api.queries.list);
  const predictions = useQuery(api.predictions.listByUser);

  const handleExport = () => {
    toast.success("Exporting query history...");
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-light mb-2 text-foreground tracking-tight" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, letterSpacing: '-0.02em' }}>Query History</h1>
            <p className="text-muted-foreground font-light" style={{ letterSpacing: '0.01em' }}>
              Review your past queries and analysis results
            </p>
          </div>
          <Button onClick={handleExport} className="neon-glow">
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="macos-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Timestamp</TableHead>
                <TableHead>Query</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queries?.map((query: any, index: number) => {
                const prediction = predictions?.find((p: any) => p.queryId === query._id);
                return (
                  <motion.tr
                    key={query._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-border/50 hover:bg-primary/5 macos-transition"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(query._creationTime).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <MessageSquare className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                        <p className="text-sm line-clamp-2">{query.queryText}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          query.status === "completed"
                            ? "default"
                            : query.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {query.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {prediction && (
                        <ConfidenceBadge
                          level={prediction.confidenceLevel}
                          score={prediction.confidenceScore}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="macos-button">
                        View Details
                      </Button>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>

          {(!queries || queries.length === 0) && (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No query history yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start analyzing cases to build your history
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
