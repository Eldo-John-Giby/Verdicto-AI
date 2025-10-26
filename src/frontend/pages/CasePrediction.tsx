import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "react-router";
import {
  Upload,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  TrendingUp,
  Info,
  User,
  Briefcase,
  Mic,
  MicOff,
  Globe,
  Languages,
  Sparkles,
} from "lucide-react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function CasePrediction() {
  const location = useLocation();
  const [queryText, setQueryText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentQueryId, setCurrentQueryId] = useState<Id<"queries"> | null>(null);
  const [userMode, setUserMode] = useState<"citizen" | "lawyer">("citizen");
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<Id<"documents">[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Multilingual features
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [supportedLanguages, setSupportedLanguages] = useState<any[]>([]);
  
  // Simplification features
  const [simplifiedText, setSimplifiedText] = useState("");
  const [isSimplifying, setIsSimplifying] = useState(false);
  
  // Translation features
  const [translatedPrediction, setTranslatedPrediction] = useState("");
  const [translatedReasoning, setTranslatedReasoning] = useState("");
  const [isTranslatingResponse, setIsTranslatingResponse] = useState(false);
  
  // Simulation features
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [modifications, setModifications] = useState<any>({});

  const createQuery = useMutation(api.queries.create);
  const analyzeWithRAG = useAction(api.rag.analyzeQuery);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createDocument = useMutation(api.documents.create);
  const processDocumentWithRAG = useAction(api.rag.processDocument);
  
  const prediction = useQuery(
    api.predictions.getByQuery,
    currentQueryId ? { queryId: currentQueryId } : "skip"
  );
  const biasReport = useQuery(
    api.biasReports.getByPrediction,
    prediction ? { predictionId: prediction._id } : "skip"
  );
  const cases = useQuery(api.cases.list, {});
  const documents = useQuery(api.documents.list, {});

  // Hackathon feature actions
  const translateQuery = useAction(api.hackathonFeatures.translateQuery);
  const translateResponse = useAction(api.hackathonFeatures.translateResponse);
  const getSupportedLanguages = useAction(api.hackathonFeatures.getSupportedLanguages);
  const simplifyText = useAction(api.hackathonFeatures.simplifyText);
  const simulateOutcome = useAction(api.hackathonFeatures.simulateOutcome);

  // Load supported languages on mount
  useEffect(() => {
    const loadLanguages = async () => {
      const result = await getSupportedLanguages({});
      if (result.success) {
        setSupportedLanguages(result.languages);
      }
    };
    loadLanguages();
  }, [getSupportedLanguages]);

  // Handle pre-selected document from navigation state
  useEffect(() => {
    if (location.state?.selectedDocumentId) {
      const docId = location.state.selectedDocumentId as Id<"documents">;
      setSelectedDocuments([docId]);
      toast.info("Document pre-selected for analysis");
    }
  }, [location.state]);

  // Auto-translate prediction results when language changes
  useEffect(() => {
    // Only translate if we have a prediction and non-English language is selected
    if (!prediction || selectedLanguage === "en" || !prediction.prediction) {
      setTranslatedPrediction("");
      setTranslatedReasoning("");
      return;
    }

    const translateResults = async () => {
      setIsTranslatingResponse(true);
      try {
        // Translate prediction
        const predictionResult = await translateResponse({
          text: prediction.prediction,
          targetLang: selectedLanguage
        });

        if (predictionResult.status === "success" && predictionResult.translation?.translated_text) {
          setTranslatedPrediction(predictionResult.translation.translated_text);
        }

        // Translate reasoning if it exists
        if (prediction.reasoning) {
          const reasoningResult = await translateResponse({
            text: prediction.reasoning,
            targetLang: selectedLanguage
          });

          if (reasoningResult.status === "success" && reasoningResult.translation?.translated_text) {
            setTranslatedReasoning(reasoningResult.translation.translated_text);
          }
        }

        toast.success(`Results translated to ${selectedLanguage}`);
      } catch (error) {
        console.error("Translation error:", error);
        toast.error("Failed to translate results");
      } finally {
        setIsTranslatingResponse(false);
      }
    };

    translateResults();
  }, [prediction, selectedLanguage, translateResponse]);

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    const uploadedDocIds: Id<"documents">[] = [];
    
    try {
      for (const file of files) {
        // Validate file
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 10MB limit`);
          continue;
        }
        
        if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
          toast.error(`${file.name} is not a PDF file`);
          continue;
        }
        
        toast.info(`Uploading ${file.name}...`);
        
        // Step 1: Get upload URL
        const uploadUrl = await generateUploadUrl();
        
        // Step 2: Upload file to Convex storage
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        const { storageId } = await uploadResponse.json();
        
        // Step 3: Create document record
        const documentId = await createDocument({
          title: file.name,
          jurisdiction: "General",
          fileId: storageId,
          metadata: {
            documentType: "legal_document",
            version: "1.0",
            fileSize: file.size,
          },
        });
        
        uploadedDocIds.push(documentId);
        toast.success(`${file.name} uploaded successfully`);
        
        // Step 4: Process with RAG backend
        toast.info(`Processing ${file.name} with AI...`);
        await processDocumentWithRAG({
          documentId,
          fileUrl: storageId,
          title: file.name,
        });
        
        toast.success(`${file.name} processed and ready for analysis`);
      }
      
      // Auto-select uploaded documents
      if (uploadedDocIds.length > 0) {
        setSelectedDocuments(uploadedDocIds);
        toast.success(`${uploadedDocIds.length} document(s) ready for case analysis`);
      }
      
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload documents. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!queryText.trim()) {
      toast.error("Please enter a query");
      return;
    }

    setIsAnalyzing(true);
    try {
      let processedQuery = queryText;
      
      // Translate query to English if non-English language selected
      if (selectedLanguage !== "en") {
        try {
          const translationResult = await translateQuery({
            text: queryText,
            sourceLang: selectedLanguage,
            targetLang: "en"
          });
          
          console.log("Translation result:", translationResult);
          
          // Backend returns: { status: "success", translation: { translated_text: "..." } }
          if (translationResult.status === "success" && translationResult.translation?.translated_text) {
            processedQuery = translationResult.translation.translated_text;
            toast.success(`Translated from ${selectedLanguage} to English`);
          } else {
            console.warn("Translation response missing translated_text:", translationResult);
            toast.warning("Translation unavailable, using original text");
          }
        } catch (error) {
          console.warn("Translation failed, using original text:", error);
          toast.warning("Translation failed, using original text");
        }
      }
      
      const queryId = await createQuery({ 
        queryText: processedQuery,
        uploadedFiles: undefined
      });
      setCurrentQueryId(queryId);
      
      // Send to RAG backend for analysis with selected documents
      await analyzeWithRAG({ 
        queryId, 
        queryText: processedQuery,
        documentIds: selectedDocuments.length > 0 ? selectedDocuments : undefined
      });
      
      toast.success("Analysis complete!");
    } catch (error) {
      toast.error("Analysis failed. Please try again.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }

    if (isRecording) {
      if (recognition) {
        recognition.stop();
      }
      setIsRecording(false);
      toast.success("Recording stopped");
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsRecording(true);
        toast.success("Recording started - speak now");
      };

      recognitionInstance.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        // Update interim transcript for live display
        setInterimTranscript(interim);

        // Append final transcript to the query text
        if (final) {
          setQueryText(prev => prev + final);
          setInterimTranscript(''); // Clear interim once finalized
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast.error(`Recording error: ${event.error}`);
        setIsRecording(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
        setInterimTranscript(''); // Clear interim on end
      };

      setRecognition(recognitionInstance);
      recognitionInstance.start();
    }
  };

  const handleSimplify = async () => {
    if (!prediction) return;
    
    setIsSimplifying(true);
    try {
      const result = await simplifyText({
        legalText: prediction.prediction,
        readingLevel: userMode === "citizen" ? "simple" : "intermediate"
      });
      
      console.log("Simplification result:", result);
      
      if (result.status === "success" && result.simplification) {
        // The backend returns: { status: "success", simplification: { simplified_text: "...", ... } }
        const simplifiedText = result.simplification.simplified_text;
        
        if (simplifiedText) {
          setSimplifiedText(simplifiedText);
          toast.success("Text simplified!");
        } else {
          toast.error("No simplified text in response");
          console.error("Missing simplified_text in:", result.simplification);
        }
      } else {
        toast.error("Simplification request failed");
        console.error("Unexpected result structure:", result);
      }
    } catch (error) {
      toast.error("Simplification failed");
      console.error("Simplification error:", error);
    } finally {
      setIsSimplifying(false);
    }
  };

  const handleSimulate = async () => {
    if (!prediction) return;
    
    try {
      const result = await simulateOutcome({
        baseCase: { facts: queryText },
        modifications
      });
      
      if (result.success) {
        setSimulationResult(result.simulation);
        toast.success("Simulation complete!");
      }
    } catch (error) {
      toast.error("Simulation failed");
      console.error(error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "high":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-light mb-2 text-foreground tracking-tight" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, letterSpacing: '-0.02em' }}>Case Prediction</h1>
        <p className="text-muted-foreground font-light" style={{ letterSpacing: '0.01em' }}>
          AI-powered legal analysis with bias detection
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="macos-card p-6 mb-6 neon-glow">
            <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Documents (Optional)</label>
              <Select 
                value={selectedDocuments.length > 0 ? selectedDocuments[0] : "none"} 
                onValueChange={(val) => {
                  if (val === "none") {
                    setSelectedDocuments([]);
                  } else {
                    setSelectedDocuments([val as Id<"documents">]);
                  }
                }}
              >
                <SelectTrigger className="w-full macos-vibrancy">
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Search all documents or select specific ones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Search all documents</SelectItem>
                  {documents?.filter(doc => doc.status === "processed").map((doc) => (
                    <SelectItem key={doc._id} value={doc._id}>
                      {doc.title} ({doc.jurisdiction})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Language</label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-[200px] macos-vibrancy">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi (हिन्दी)</SelectItem>
                  <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                  <SelectItem value="te">Telugu (తెలుగు)</SelectItem>
                  <SelectItem value="bn">Bengali (বাংলা)</SelectItem>
                  <SelectItem value="mr">Marathi (मराठी)</SelectItem>
                  <SelectItem value="gu">Gujarati (ગુજરાતી)</SelectItem>
                  <SelectItem value="kn">Kannada (ಕನ್ನಡ)</SelectItem>
                  <SelectItem value="ml">Malayalam (മലയാളം)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Describe your case or legal question
              </label>
              <Textarea
                placeholder="Ask about a case, upload documents, or describe a legal scenario..."
                value={queryText + interimTranscript}
                onChange={(e) => {
                  if (!isRecording) {
                    setQueryText(e.target.value);
                  }
                }}
                className="min-h-[120px] macos-vibrancy resize-none"
                disabled={isAnalyzing}
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                className="macos-vibrancy"
                disabled={isAnalyzing || isUploading}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf';
                  input.multiple = true;
                  input.onchange = async (e: any) => {
                    const files = Array.from(e.target.files || []) as File[];
                    if (files.length > 0) {
                      await handleFileUpload(files);
                    }
                  };
                  input.click();
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="macos-vibrancy"
                onClick={toggleRecording}
                disabled={isAnalyzing}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2 animate-pulse text-red-500" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Live Transcribe
                  </>
                )}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isAnalyzing || !queryText.trim()}
                className="neon-glow ml-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Analyze Case
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {prediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <Card className="macos-card p-2 inline-flex items-center gap-2">
              <Button
                variant={userMode === "citizen" ? "default" : "ghost"}
                size="sm"
                onClick={() => setUserMode("citizen")}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                Citizen Mode
              </Button>
              <Button
                variant={userMode === "lawyer" ? "default" : "ghost"}
                size="sm"
                onClick={() => setUserMode("lawyer")}
                className="gap-2"
              >
                <Briefcase className="h-4 w-4" />
                Lawyer Mode
              </Button>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="macos-card p-6 neon-glow hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center neon-glow">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold">AI Prediction</h3>
                    <ConfidenceBadge
                      level={prediction.confidenceLevel}
                      score={prediction.confidenceScore}
                    />
                  </div>
                  {isTranslatingResponse && selectedLanguage !== "en" ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Translating...</span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {selectedLanguage !== "en" && translatedPrediction 
                        ? translatedPrediction 
                        : prediction.prediction}
                    </p>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confidence Score</span>
                  <span className="text-2xl font-bold text-primary">
                    {Math.round(prediction.confidenceScore * 100)}%
                  </span>
                </div>
                <Progress value={prediction.confidenceScore * 100} className="h-3" />
              </div>

              {(prediction.biasFlags || []).length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Bias Alerts
                    </h4>
                    <div className="space-y-2">
                      {(prediction.biasFlags || []).map((flag: any, index: number) => (
                        <div
                          key={index}
                          className="macos-vibrancy p-3 rounded-lg flex items-start gap-3"
                        >
                          <AlertTriangle
                            className={`h-5 w-5 mt-0.5 ${getSeverityColor(flag.severity)}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{flag.type}</span>
                              <Badge
                                variant={
                                  flag.severity === "high"
                                    ? "destructive"
                                    : flag.severity === "medium"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {flag.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {flag.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator className="my-4" />
              
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  onClick={handleSimplify}
                  disabled={isSimplifying}
                  className="w-full macos-vibrancy"
                >
                  {isSimplifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Simplifying...
                    </>
                  ) : (
                    <>
                      <Languages className="h-4 w-4 mr-2" />
                      Simplify to Plain Language
                    </>
                  )}
                </Button>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full macos-vibrancy">
                      <Info className="h-4 w-4 mr-2" />
                      Why this prediction?
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="macos-card w-full sm:max-w-xl">
                  <SheetHeader>
                    <SheetTitle>AI Reasoning</SheetTitle>
                    <SheetDescription>
                      Explainable AI analysis for this prediction
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                    <div className="space-y-4 pr-4">
                      <div className="macos-vibrancy p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Analysis Method</h4>
                        {isTranslatingResponse && selectedLanguage !== "en" ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Translating reasoning...</span>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {selectedLanguage !== "en" && translatedReasoning 
                              ? translatedReasoning 
                              : prediction.reasoning}
                          </p>
                        )}
                      </div>

                      {biasReport && (
                        <div className="macos-vibrancy p-4 rounded-lg">
                          <h4 className="font-medium mb-3">Bias Analysis</h4>
                          <div className="space-y-3">
                            {Object.entries(biasReport.categories).map(([key, value]) => (
                              <div key={key}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm capitalize">{key}</span>
                                  <span className="text-sm font-medium">
                                    {Math.round((value as number) * 100)}%
                                  </span>
                                </div>
                                <Progress value={(value as number) * 100} className="h-2" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
              </div>
            </Card>
          </motion.div>

          {simplifiedText && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <Card className="macos-card p-6 neon-glow">
                <div className="flex items-center gap-2 mb-3">
                  <Languages className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Plain Language Explanation</h4>
                </div>
                <p className="text-muted-foreground leading-relaxed">{simplifiedText}</p>
              </Card>
            </motion.div>
          )}

          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mt-6"
          >
            <Card className="macos-card p-6 hover:shadow-2xl transition-shadow duration-300">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Supporting Evidence
              </h3>
              <div className="space-y-3">
                {(prediction.evidenceSnippets || []).map((snippet: any, index: number) => {
                  const relatedCase = cases?.find((c: any) => c._id === snippet.caseId);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ x: 4, scale: 1.02 }}
                      transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                      className="macos-vibrancy p-4 rounded-lg hover:bg-primary/5 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-sm">
                            {relatedCase?.caseNumber || "Case Reference"}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(snippet.relevance * 100)}% relevant
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {relatedCase?.title}
                      </p>
                      <p className="text-sm">{snippet.snippet}</p>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* What-If Simulation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="macos-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  What-If Simulation
                </h3>
                <Button 
                  onClick={() => setShowSimulation(!showSimulation)}
                  variant="ghost"
                  size="sm"
                >
                  {showSimulation ? "Hide" : "Show"}
                </Button>
              </div>

              {showSimulation && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Label className="flex items-center gap-2 p-3 macos-vibrancy rounded-lg cursor-pointer hover:bg-primary/5">
                      <Checkbox
                        checked={modifications.remove_prior_conviction || false}
                        onCheckedChange={(checked) => 
                          setModifications({...modifications, remove_prior_conviction: checked})
                        }
                      />
                      <span className="text-sm">Remove Prior Conviction</span>
                    </Label>

                    <Label className="flex items-center gap-2 p-3 macos-vibrancy rounded-lg cursor-pointer hover:bg-primary/5">
                      <Checkbox
                        checked={modifications.add_strong_alibi || false}
                        onCheckedChange={(checked) => 
                          setModifications({...modifications, add_strong_alibi: checked})
                        }
                      />
                      <span className="text-sm">Add Strong Alibi</span>
                    </Label>

                    <Label className="flex items-center gap-2 p-3 macos-vibrancy rounded-lg cursor-pointer hover:bg-primary/5">
                      <Checkbox
                        checked={modifications.improve_witness_credibility || false}
                        onCheckedChange={(checked) => 
                          setModifications({...modifications, improve_witness_credibility: checked})
                        }
                      />
                      <span className="text-sm">Improve Witness Credibility</span>
                    </Label>

                    <Label className="flex items-center gap-2 p-3 macos-vibrancy rounded-lg cursor-pointer hover:bg-primary/5">
                      <Checkbox
                        checked={modifications.add_mitigating_factors || false}
                        onCheckedChange={(checked) => 
                          setModifications({...modifications, add_mitigating_factors: checked})
                        }
                      />
                      <span className="text-sm">Add Mitigating Factors</span>
                    </Label>

                    <Label className="flex items-center gap-2 p-3 macos-vibrancy rounded-lg cursor-pointer hover:bg-primary/5">
                      <Checkbox
                        checked={modifications.reduce_flight_risk || false}
                        onCheckedChange={(checked) => 
                          setModifications({...modifications, reduce_flight_risk: checked})
                        }
                      />
                      <span className="text-sm">Reduce Flight Risk</span>
                    </Label>

                    <Label className="flex items-center gap-2 p-3 macos-vibrancy rounded-lg cursor-pointer hover:bg-primary/5">
                      <Checkbox
                        checked={modifications.enhance_evidence || false}
                        onCheckedChange={(checked) => 
                          setModifications({...modifications, enhance_evidence: checked})
                        }
                      />
                      <span className="text-sm">Enhance Evidence Quality</span>
                    </Label>
                  </div>

                  <Button 
                    onClick={handleSimulate} 
                    className="w-full neon-glow"
                    disabled={Object.keys(modifications).length === 0}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Run Simulation
                  </Button>

                  {simulationResult && (
                    <div className="mt-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2 text-sm text-muted-foreground">Base Case</h4>
                          <p className="text-2xl font-bold capitalize">
                            {simulationResult.base_case.prediction.predictedOutcome}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Confidence: {Math.round(simulationResult.base_case.prediction.confidenceScore * 100)}%
                          </p>
                        </div>
                        
                        <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                          <h4 className="font-medium mb-2 text-sm text-primary">Modified Case</h4>
                          <p className="text-2xl font-bold capitalize">
                            {simulationResult.modified_case.prediction.predictedOutcome}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Confidence: {Math.round(simulationResult.modified_case.prediction.confidenceScore * 100)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Impact Analysis</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {simulationResult.impact_analysis.recommendation}
                        </p>
                        {simulationResult.impact_analysis.outcome_changed && (
                          <Badge variant="default" className="mt-2">
                            Outcome Changed: {simulationResult.impact_analysis.confidence_change_percent}% confidence shift
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}

      {!prediction && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 neon-glow">
            <TrendingUp className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Ready to Analyze</h3>
          <p className="text-muted-foreground">
            Enter your legal query above to get AI-powered predictions
          </p>
        </motion.div>
      )}
    </div>
  );
}