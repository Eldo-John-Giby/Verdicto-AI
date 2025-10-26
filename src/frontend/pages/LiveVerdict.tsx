import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Gavel, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function LiveVerdict() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [verdictAnalysis, setVerdictAnalysis] = useState<any>(null);
  const [generatedNotes, setGeneratedNotes] = useState<any>(null);
  const [interimTranscript, setInterimTranscript] = useState("");

  const analyzeWithRAG = useAction(api.rag.analyzeQuery);
  const generateNotesAction = useAction(api.rag.generateNotes);
  const createQuery = useMutation(api.queries.create);
  const createNote = useMutation(api.verdictNotes.create);

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart + " ";
          } else {
            interimTranscript += transcriptPart;
          }
        }

        // Only append final transcript to permanent transcript
        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
        }
        
        // Update interim transcript separately for live display
        setInterimTranscript(interimTranscript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        toast.error("Speech recognition error: " + event.error);
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      toast.success("Recording stopped - Ready to analyze");
    } else {
      setTranscript("");
      setVerdictAnalysis(null);
      setGeneratedNotes(null);
      recognition.start();
      setIsRecording(true);
      toast.success("Recording started");
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setVerdictAnalysis(null);
    setGeneratedNotes(null);
    toast.success("Transcript cleared");
  };

  const analyzeVerdict = async () => {
    if (!transcript.trim()) {
      toast.error("No transcript to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      toast.info("Analyzing proceedings...");

      const queryId = await createQuery({
        queryText: `Analyze the following court proceedings and provide: 1) A verdict determination, 2) Legal conclusion with reasoning, 3) Recommended punishment or sentence if applicable. Proceedings: ${transcript}`,
        uploadedFiles: undefined,
      });

      const result = await analyzeWithRAG({
        queryId,
        queryText: `Analyze the following court proceedings and provide: 1) A verdict determination, 2) Legal conclusion with reasoning, 3) Recommended punishment or sentence if applicable. Proceedings: ${transcript}`,
        documentIds: undefined,
      });

      setVerdictAnalysis({
        verdict: extractVerdict(result.response),
        conclusion: extractConclusion(result.response),
        punishment: extractPunishment(result.response),
        fullAnalysis: result.response,
        confidence: result.predictionId ? 0.85 : 0.75,
      });

      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze proceedings");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateNotes = async () => {
    if (!transcript.trim()) {
      toast.error("No transcript to generate notes from");
      return;
    }

    setIsGeneratingNotes(true);
    try {
      toast.info("Generating notes...");

      const result = await generateNotesAction({
        transcript: transcript,
      });

      if (result.success) {
        const notes = {
          bulletPoints: result.bulletPoints,
          aiSummary: result.aiSummary,
          transcript: transcript,
          timestamp: Date.now(),
        };

        setGeneratedNotes(notes);

        // Save to history
        const title = `Verdict Notes - ${new Date().toLocaleString()}`;
        await createNote({
          title,
          transcript: transcript,
          bulletPoints: result.bulletPoints,
          aiSummary: result.aiSummary,
        });

        toast.success("Notes generated and saved to history!");
      }
    } catch (error) {
      console.error("Note generation error:", error);
      toast.error("Failed to generate notes");
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const downloadNotes = (notes: any) => {
    const sentences = notes.transcript.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
    const summaryItems = sentences.length >= 5 ? sentences.slice(0, 5) : 
      (sentences.length > 0 ? sentences : 
        [notes.transcript.substring(0, 200) + (notes.transcript.length > 200 ? '...' : '')]);
    
    const transcriptSummary = summaryItems
      .map((sentence: string, idx: number) => `${idx + 1}. ${sentence.trim()}`)
      .join('\n');

    const content = `
LIVE VERDICT NOTES
Generated: ${new Date(notes.timestamp).toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRANSCRIPT:
${notes.transcript}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEY POINTS:
${notes.bulletPoints.map((point: string, idx: number) => `${idx + 1}. ${point}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AI SUMMARY:
${notes.aiSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRANSCRIPT SUMMARY:
${transcriptSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated by LexAI - Legal AI Assistant
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verdict-notes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Notes downloaded!");
  };

  // Helper functions to extract structured data from RAG response
  const extractVerdict = (response: string): string => {
    const verdictMatch = response.match(/verdict[:\s]+([^.]+)/i);
    return verdictMatch ? verdictMatch[1].trim() : "Analysis pending";
  };

  const extractConclusion = (response: string): string => {
    const conclusionMatch = response.match(/conclusion[:\s]+([^.]+\.)/i);
    return conclusionMatch ? conclusionMatch[1].trim() : response.substring(0, 200) + "...";
  };

  const extractPunishment = (response: string): string => {
    const punishmentMatch = response.match(/punishment|sentence[:\s]+([^.]+)/i);
    return punishmentMatch ? punishmentMatch[1].trim() : "To be determined";
  };

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Live Verdict</h1>
          <p className="text-muted-foreground">
            Record live proceedings and get real-time transcription with AI analysis
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
            <Button
              onClick={toggleRecording}
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className="gap-2"
              disabled={isAnalyzing || isGeneratingNotes}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-5 w-5" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  Start Recording
                </>
              )}
            </Button>

            {transcript && !isRecording && (
              <>
                <Button 
                  onClick={analyzeVerdict} 
                  variant="default"
                  disabled={isAnalyzing || isGeneratingNotes}
                  className="gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Gavel className="h-5 w-5" />
                      Generate Verdict
                    </>
                  )}
                </Button>
                <Button 
                  onClick={generateNotes} 
                  variant="default"
                  disabled={isAnalyzing || isGeneratingNotes}
                  className="gap-2"
                >
                  {isGeneratingNotes ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5" />
                      Generate Notes
                    </>
                  )}
                </Button>
                <Button onClick={clearTranscript} variant="outline">
                  Clear
                </Button>
              </>
            )}
          </div>

          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 mb-4 text-red-500"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Recording in progress...</span>
            </motion.div>
          )}

          <div className="min-h-[400px] max-h-[600px] overflow-y-auto p-4 rounded-lg bg-muted/50 border border-border">
            {transcript || interimTranscript ? (
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {transcript}
                {interimTranscript && (
                  <span className="text-muted-foreground italic">{interimTranscript}</span>
                )}
              </p>
            ) : (
              <p className="text-muted-foreground text-center">
                Click "Start Recording" to begin transcription...
              </p>
            )}
          </div>
        </Card>

        {/* Generated Notes Display */}
        <AnimatePresence>
          {generatedNotes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Generated Notes</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(generatedNotes.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => downloadNotes(generatedNotes)}
                    variant="outline"
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Download
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Key Points
                    </h4>
                    <ul className="space-y-2">
                      {generatedNotes.bulletPoints.map((point: string, idx: number) => (
                        <li key={idx} className="flex gap-2 text-foreground">
                          <span className="text-primary font-semibold">{idx + 1}.</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      AI Summary
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {generatedNotes.aiSummary}
                    </p>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Transcript Summary
                    </h4>
                    <ul className="space-y-2">
                      {(() => {
                        const sentences = generatedNotes.transcript.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
                        const summaryItems = sentences.length >= 5 ? sentences.slice(0, 5) : 
                          (sentences.length > 0 ? sentences : 
                            [generatedNotes.transcript.substring(0, 200) + (generatedNotes.transcript.length > 200 ? '...' : '')]);
                        
                        return summaryItems.map((sentence: string, idx: number) => (
                          <li key={idx} className="flex gap-2 text-muted-foreground">
                            <span className="text-primary font-semibold">•</span>
                            <span>{sentence.trim()}</span>
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verdict Analysis Display */}
        <AnimatePresence>
          {verdictAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Gavel className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Verdict Analysis</h3>
                    <p className="text-sm text-muted-foreground">AI-powered legal analysis</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Verdict
                      </h4>
                      <Badge variant="default">
                        {Math.round(verdictAnalysis.confidence * 100)}% Confidence
                      </Badge>
                    </div>
                    <p className="text-foreground">{verdictAnalysis.verdict}</p>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Legal Conclusion
                    </h4>
                    <p className="text-muted-foreground">{verdictAnalysis.conclusion}</p>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Recommended Punishment
                    </h4>
                    <p className="text-muted-foreground">{verdictAnalysis.punishment}</p>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Full Analysis</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {verdictAnalysis.fullAnalysis}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This feature uses your browser's speech recognition
            capabilities. After recording, click "Generate Verdict" for AI analysis or
            "Generate Notes" for a structured summary with key points. All generated notes
            are automatically saved to your history and can be accessed from the "Live Verdict History" page.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}