import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Loader2, Copy, CheckCircle2, FileDown } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export default function DocumentGenerator() {
  const [documentType, setDocumentType] = useState("bail_application");
  const [templates, setTemplates] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateDocument = useAction(api.hackathonFeatures.generateDocument);
  const getTemplates = useAction(api.hackathonFeatures.getDocumentTemplates);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const result = await getTemplates({});
        if (result.success) {
          setTemplates(result.templates);
        }
      } catch (error) {
        console.warn("Templates not available:", error);
      }
    };
    loadTemplates();
  }, [getTemplates]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateDocument({
        documentType,
        details: formData
      });
      
      if (result.status === "success" && result.document) {
        setGeneratedDoc(result.document.content);
        toast.success("Document generated successfully!");
      } else {
        toast.error("Failed to generate document");
      }
    } catch (error) {
      toast.error("Generation failed. Make sure the backend is running.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDoc);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedDoc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentType}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Document downloaded!");
  };

  const handleDownloadPDF = () => {
    // Create a simple PDF using browser print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${documentType}_${Date.now()}</title>
            <style>
              body { 
                font-family: 'Times New Roman', serif; 
                padding: 40px; 
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
              }
              pre { 
                white-space: pre-wrap; 
                word-wrap: break-word;
                font-family: 'Times New Roman', serif;
              }
            </style>
          </head>
          <body>
            <pre>${generatedDoc}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        toast.success("PDF print dialog opened!");
      }, 250);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-light mb-2 text-foreground tracking-tight" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, letterSpacing: '-0.02em' }}>
          Document Generator
        </h1>
        <p className="text-muted-foreground font-light" style={{ letterSpacing: '0.01em' }}>
          Generate legal documents from AI-powered templates
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="macos-card p-6">
            <h3 className="text-lg font-bold mb-4">Document Details</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Document Type</Label>
                <Select value={documentType} onValueChange={(val) => {
                  setDocumentType(val);
                  setGeneratedDoc("");
                  setFormData({});
                }}>
                  <SelectTrigger className="macos-vibrancy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bail_application">Bail Application</SelectItem>
                    <SelectItem value="fir_complaint">FIR/Complaint</SelectItem>
                    <SelectItem value="legal_notice">Legal Notice</SelectItem>
                    <SelectItem value="petition">Court Petition</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {documentType === "bail_application" && (
                <>
                  <div>
                    <Label>Applicant Name</Label>
                    <Input 
                      value={formData.applicant_name || ""}
                      onChange={(e) => setFormData({...formData, applicant_name: e.target.value})}
                      className="macos-vibrancy"
                      placeholder="Enter applicant name"
                    />
                  </div>

                  <div>
                    <Label>State</Label>
                    <Input 
                      value={formData.state || ""}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="macos-vibrancy"
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <Label>FIR Number (Optional)</Label>
                    <Input 
                      value={formData.fir_number || ""}
                      onChange={(e) => setFormData({...formData, fir_number: e.target.value})}
                      className="macos-vibrancy"
                      placeholder="e.g., 123/2024"
                    />
                  </div>

                  <div>
                    <Label>Charges (Optional)</Label>
                    <Input 
                      value={formData.charges || ""}
                      onChange={(e) => setFormData({...formData, charges: e.target.value})}
                      className="macos-vibrancy"
                      placeholder="e.g., Section 420 IPC"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.first_time_offender || false}
                      onCheckedChange={(checked) => setFormData({...formData, first_time_offender: checked})}
                    />
                    <Label>First-time offender</Label>
                  </div>
                </>
              )}

              {documentType === "fir_complaint" && (
                <>
                  <div>
                    <Label>Complainant Name</Label>
                    <Input 
                      value={formData.complainant_name || ""}
                      onChange={(e) => setFormData({...formData, complainant_name: e.target.value})}
                      className="macos-vibrancy"
                      placeholder="Enter complainant name"
                    />
                  </div>

                  <div>
                    <Label>Incident Description</Label>
                    <Textarea 
                      value={formData.incident_description || ""}
                      onChange={(e) => setFormData({...formData, incident_description: e.target.value})}
                      className="macos-vibrancy min-h-[100px]"
                      placeholder="Describe the incident"
                    />
                  </div>

                  <div>
                    <Label>Location</Label>
                    <Input 
                      value={formData.location || ""}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="macos-vibrancy"
                      placeholder="Where did it occur?"
                    />
                  </div>

                  <div>
                    <Label>Date of Incident</Label>
                    <Input 
                      type="date"
                      value={formData.date || ""}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="macos-vibrancy"
                    />
                  </div>
                </>
              )}

              {documentType === "legal_notice" && (
                <>
                  <div>
                    <Label>Sender Name</Label>
                    <Input 
                      value={formData.sender_name || ""}
                      onChange={(e) => setFormData({...formData, sender_name: e.target.value})}
                      className="macos-vibrancy"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <Label>Recipient Name</Label>
                    <Input 
                      value={formData.recipient_name || ""}
                      onChange={(e) => setFormData({...formData, recipient_name: e.target.value})}
                      className="macos-vibrancy"
                      placeholder="Recipient name"
                    />
                  </div>

                  <div>
                    <Label>Issue Description</Label>
                    <Textarea 
                      value={formData.issue || ""}
                      onChange={(e) => setFormData({...formData, issue: e.target.value})}
                      className="macos-vibrancy min-h-[100px]"
                      placeholder="Describe the legal issue"
                    />
                  </div>

                  <div>
                    <Label>Demand/Resolution</Label>
                    <Textarea 
                      value={formData.demand || ""}
                      onChange={(e) => setFormData({...formData, demand: e.target.value})}
                      className="macos-vibrancy min-h-[100px]"
                      placeholder="What do you want?"
                    />
                  </div>
                </>
              )}

              {documentType === "petition" && (
                <>
                  <div>
                    <Label>Petitioner Name</Label>
                    <Input 
                      value={formData.petitioner_name || ""}
                      onChange={(e) => setFormData({...formData, petitioner_name: e.target.value})}
                      className="macos-vibrancy"
                      placeholder="Enter petitioner name"
                    />
                  </div>

                  <div>
                    <Label>Court Name</Label>
                    <Input 
                      value={formData.court || ""}
                      onChange={(e) => setFormData({...formData, court: e.target.value})}
                      className="macos-vibrancy"
                      placeholder="e.g., High Court of Delhi"
                    />
                  </div>

                  <div>
                    <Label>Matter Description</Label>
                    <Textarea 
                      value={formData.matter || ""}
                      onChange={(e) => setFormData({...formData, matter: e.target.value})}
                      className="macos-vibrancy min-h-[100px]"
                      placeholder="Describe the matter"
                    />
                  </div>

                  <div>
                    <Label>Relief Sought</Label>
                    <Textarea 
                      value={formData.relief || ""}
                      onChange={(e) => setFormData({...formData, relief: e.target.value})}
                      className="macos-vibrancy min-h-[100px]"
                      placeholder="What relief are you seeking?"
                    />
                  </div>
                </>
              )}

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || Object.keys(formData).length === 0} 
                className="w-full neon-glow"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Document
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Preview Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="macos-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Generated Document</h3>
              {generatedDoc && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCopy}
                    className="macos-vibrancy"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownload}
                    className="macos-vibrancy"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download TXT
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadPDF}
                    className="macos-vibrancy"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              )}
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 min-h-[500px] max-h-[600px] overflow-y-auto">
              {generatedDoc ? (
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {generatedDoc}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Generated document will appear here...</p>
                    <p className="text-sm mt-2">Fill in the form and click Generate</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}