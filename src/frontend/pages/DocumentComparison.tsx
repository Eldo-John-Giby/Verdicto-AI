import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, FileText, AlertTriangle, CheckCircle, Download, Trash2 } from "lucide-react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export default function DocumentComparison() {
  const [selectedDocuments, setSelectedDocuments] = useState<Id<"documents">[]>([]);
  const [activeComparison, setActiveComparison] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<any>(null);

  const documents = useQuery(api.documents.list, { status: "processed" });
  const comparisons = useQuery(api.comparison.getUserComparisons);
  const compareDocuments = useAction(api.comparison.compareDocuments);
  const deleteComparison = useMutation(api.comparison.deleteComparison);

  const handleCompare = async () => {
    if (selectedDocuments.length < 2 || selectedDocuments.length > 5) {
      toast.error("Please select 2-5 documents to compare");
      return;
    }

    setIsComparing(true);
    toast.info("Comparing documents...");
    try {
      const result = await compareDocuments({ documentIds: selectedDocuments });
      toast.success("Comparison completed");
      setActiveComparison(result);
      setSelectedDocuments([]);
    } catch (error) {
      toast.error("Failed to compare documents");
    } finally {
      setIsComparing(false);
    }
  };

  const handleDelete = async (comparisonId: Id<"documentComparisons">) => {
    try {
      await deleteComparison({ comparisonId });
      toast.success("Comparison deleted");
      if (activeComparison?.comparisonId === comparisonId) {
        setActiveComparison(null);
      }
    } catch (error) {
      toast.error("Failed to delete comparison");
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-500";
    if (score >= 40) return "text-yellow-500";
    return "text-green-500";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return "High Risk";
    if (score >= 40) return "Medium Risk";
    return "Low Risk";
  };

  const severityColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const conflictTypeIcons: Record<string, any> = {
    contradiction: AlertTriangle,
    inconsistency: AlertTriangle,
    missing_clause: FileText,
    conflicting_terms: AlertTriangle,
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
              Document Comparison
            </h1>
            <p className="text-muted-foreground mt-2">
              Detect conflicts and inconsistencies across legal documents
            </p>
          </div>
          <AlertTriangle className="h-12 w-12 text-muted-foreground opacity-20" />
        </div>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="glass-strong">
            <TabsTrigger value="new">New Comparison</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* New Comparison Tab */}
          <TabsContent value="new" className="space-y-6">
            {/* Document Selection */}
            <Card className="glass-strong p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium text-foreground">
                  Select Documents (2-5)
                </h2>
                <Badge variant="outline" className="text-foreground">
                  {selectedDocuments.length} selected
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {documents?.map((doc) => (
                  <motion.div
                    key={doc._id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedDocuments.includes(doc._id)
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background/50"
                    }`}
                    onClick={() => {
                      setSelectedDocuments((prev) =>
                        prev.includes(doc._id)
                          ? prev.filter((id) => id !== doc._id)
                          : prev.length < 5
                          ? [...prev, doc._id]
                          : prev
                      );
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground text-sm">{doc.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{doc.jurisdiction}</p>
                      </div>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
              </div>
              <Button
                onClick={handleCompare}
                disabled={selectedDocuments.length < 2 || selectedDocuments.length > 5 || isComparing}
                className="w-full"
              >
                {isComparing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  "Compare Documents"
                )}
              </Button>
            </Card>

            {/* Comparison Results */}
            {activeComparison && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Risk Score */}
                <Card className="glass-strong p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">Overall Risk Score</h3>
                      <p className="text-muted-foreground text-sm">
                        Based on {activeComparison.conflicts.length} conflicts detected
                      </p>
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-5xl font-bold ${getRiskColor(
                          activeComparison.overallRiskScore
                        )}`}
                      >
                        {activeComparison.overallRiskScore}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getRiskLabel(activeComparison.overallRiskScore)}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Conflicts */}
                <Card className="glass-strong p-6">
                  <h3 className="text-lg font-medium text-foreground mb-4">Detected Conflicts</h3>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {activeComparison.conflicts.map((conflict: any, index: number) => {
                        const Icon = conflictTypeIcons[conflict.type] || AlertTriangle;
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.01 }}
                            className="glass p-4 rounded-lg cursor-pointer border border-border hover:border-primary/50 transition-all"
                            onClick={() => setSelectedConflict(conflict)}
                          >
                            <div className="flex items-start gap-4">
                              <Icon className="h-5 w-5 text-orange-500 mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className={severityColors[conflict.severity]}>
                                    {conflict.severity}
                                  </Badge>
                                  <Badge variant="outline" className="text-foreground">
                                    {conflict.type.replace(/_/g, " ")}
                                  </Badge>
                                </div>
                                <p className="text-foreground font-medium">{conflict.description}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Affects {conflict.affectedDocuments.length} document(s)
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {comparisons && comparisons.length > 0 ? (
              comparisons.map((comp) => (
                <Card key={comp._id} className="glass-strong p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={severityColors[comp.overallRiskScore >= 70 ? "critical" : comp.overallRiskScore >= 40 ? "medium" : "low"]}>
                          Risk: {comp.overallRiskScore}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comp.comparisonDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-2">
                        {comp.documentTitles.join(" • ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {comp.conflicts.length} conflicts detected
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveComparison(comp)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(comp._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="glass-strong p-12">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No comparison history</p>
                  <p className="text-sm mt-1">Start a new comparison to see results here</p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Conflict Detail Dialog */}
        <Dialog open={!!selectedConflict} onOpenChange={() => setSelectedConflict(null)}>
          <DialogContent className="glass-strong max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Conflict Details</DialogTitle>
              <DialogDescription>
                {selectedConflict && (
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className={severityColors[selectedConflict.severity]}>
                      {selectedConflict.severity}
                    </Badge>
                    <Badge variant="outline" className="text-foreground">
                      {selectedConflict.type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedConflict && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedConflict.description}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Affected Documents</h4>
                  <div className="space-y-3">
                    {selectedConflict.affectedDocuments.map((doc: any, idx: number) => (
                      <div key={idx} className="glass p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Page {doc.page}</p>
                        <p className="text-sm text-foreground italic">"{doc.excerpt}"</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Recommendation</h4>
                  <div className="glass p-4 rounded-lg border-l-4 border-primary">
                    <p className="text-muted-foreground">{selectedConflict.recommendation}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
