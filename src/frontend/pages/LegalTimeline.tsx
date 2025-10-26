import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Calendar, FileText, Filter, Download, Clock } from "lucide-react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export default function LegalTimeline() {
  const [selectedDocuments, setSelectedDocuments] = useState<Id<"documents">[]>([]);
  const [filterEventType, setFilterEventType] = useState<string>("all");
  const [filterImportance, setFilterImportance] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const documents = useQuery(api.documents.list, { status: "processed" });
  const extractTimeline = useAction(api.timeline.extractTimelineEvents);
  const getMultiTimeline = useAction(api.timeline.getMultiDocumentTimeline);

  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  // Load timeline when documents are selected
  useEffect(() => {
    if (selectedDocuments.length > 0) {
      loadTimeline();
    } else {
      setTimelineEvents([]);
    }
  }, [selectedDocuments]);

  const loadTimeline = async () => {
    setIsLoadingTimeline(true);
    try {
      const events = await getMultiTimeline({ documentIds: selectedDocuments });
      setTimelineEvents(events);
    } catch (error) {
      toast.error("Failed to load timeline");
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  const handleExtractTimeline = async (docId: Id<"documents">) => {
    setIsExtracting(true);
    toast.info("Extracting timeline events...");
    try {
      await extractTimeline({ documentId: docId });
      toast.success("Timeline extracted successfully");
      if (selectedDocuments.includes(docId)) {
        await loadTimeline();
      }
    } catch (error) {
      toast.error("Failed to extract timeline");
    } finally {
      setIsExtracting(false);
    }
  };

  const filteredEvents = timelineEvents.filter((event) => {
    if (filterEventType !== "all" && event.eventType !== filterEventType) return false;
    if (filterImportance !== "all" && event.importance !== filterImportance) return false;
    return true;
  });

  const eventTypeColors: Record<string, string> = {
    filing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    hearing: "bg-green-500/20 text-green-400 border-green-500/30",
    judgment: "bg-red-500/20 text-red-400 border-red-500/30",
    deadline: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    motion: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    order: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    notice: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  const importanceSize: Record<string, string> = {
    high: "w-4 h-4",
    medium: "w-3 h-3",
    low: "w-2 h-2",
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
              Legal Timeline
            </h1>
            <p className="text-muted-foreground mt-2">
              Visualize chronological events from legal documents
            </p>
          </div>
          <Clock className="h-12 w-12 text-muted-foreground opacity-20" />
        </div>

        {/* Document Selection */}
        <Card className="glass-strong p-6">
          <h2 className="text-xl font-medium mb-4 text-foreground">Select Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      : [...prev, doc._id]
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
                {!doc.timelineEvents && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExtractTimeline(doc._id);
                    }}
                    disabled={isExtracting}
                  >
                    {isExtracting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Extract Timeline"
                    )}
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
          {(!documents || documents.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No processed documents available</p>
              <p className="text-sm mt-1">Upload and process documents first</p>
            </div>
          )}
        </Card>

        {/* Filters */}
        {selectedDocuments.length > 0 && (
          <Card className="glass-strong p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Filters:</span>
              </div>
              <Select value={filterEventType} onValueChange={setFilterEventType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="filing">Filing</SelectItem>
                  <SelectItem value="hearing">Hearing</SelectItem>
                  <SelectItem value="judgment">Judgment</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="motion">Motion</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="notice">Notice</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterImportance} onValueChange={setFilterImportance}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Importance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto">
                <Badge variant="outline" className="text-foreground">
                  {filteredEvents.length} events
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Timeline Visualization */}
        {isLoadingTimeline ? (
          <Card className="glass-strong p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading timeline...</p>
            </div>
          </Card>
        ) : filteredEvents.length > 0 ? (
          <Card className="glass-strong p-6">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

              {/* Events */}
              <div className="space-y-6">
                <AnimatePresence>
                  {filteredEvents.map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative pl-16"
                    >
                      {/* Event Marker */}
                      <div
                        className={`absolute left-6 top-3 rounded-full ${
                          importanceSize[event.importance]
                        } bg-primary neon-glow`}
                      />

                      {/* Event Card */}
                      <motion.div
                        whileHover={{ scale: 1.02, x: 4 }}
                        className="glass-strong p-4 rounded-lg cursor-pointer border border-border hover:border-primary/50 transition-all"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="outline"
                                className={eventTypeColors[event.eventType] || eventTypeColors.other}
                              >
                                {event.eventType}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  event.importance === "high"
                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                    : event.importance === "medium"
                                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                    : "bg-green-500/20 text-green-400 border-green-500/30"
                                }
                              >
                                {event.importance}
                              </Badge>
                            </div>
                            <p className="text-foreground font-medium">{event.description}</p>
                            {event.documentTitle && (
                              <p className="text-xs text-muted-foreground mt-2">
                                From: {event.documentTitle}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-mono">{event.date}</span>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </Card>
        ) : selectedDocuments.length > 0 ? (
          <Card className="glass-strong p-12">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No timeline events found</p>
              <p className="text-sm mt-1">Extract timeline from selected documents</p>
            </div>
          </Card>
        ) : (
          <Card className="glass-strong p-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Select documents to view timeline</p>
            </div>
          </Card>
        )}

        {/* Event Detail Dialog */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="glass-strong max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Event Details</DialogTitle>
              <DialogDescription>
                {selectedEvent?.date && (
                  <span className="font-mono">{selectedEvent.date}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge variant="outline" className={eventTypeColors[selectedEvent.eventType]}>
                    {selectedEvent.eventType}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      selectedEvent.importance === "high"
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : selectedEvent.importance === "medium"
                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        : "bg-green-500/20 text-green-400 border-green-500/30"
                    }
                  >
                    {selectedEvent.importance} importance
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedEvent.description}</p>
                </div>
                {selectedEvent.sourceReference && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Source Reference</h4>
                    <div className="glass p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        Page {selectedEvent.sourceReference.page}
                      </p>
                      <p className="text-sm text-foreground italic">
                        "{selectedEvent.sourceReference.excerpt}"
                      </p>
                    </div>
                  </div>
                )}
                {selectedEvent.documentTitle && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Document</h4>
                    <p className="text-muted-foreground">{selectedEvent.documentTitle}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
