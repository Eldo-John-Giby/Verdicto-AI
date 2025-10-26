import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  Search,
  FileText,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Eye,
  Download,
} from "lucide-react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export default function DocumentLibrary() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>("");
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  
  const documents = useQuery(api.documents.list, {
    jurisdiction: selectedJurisdiction || undefined,
  });
  const processDocumentWithRAG = useAction(api.rag.processDocument);
  const createDocument = useMutation(api.documents.create);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);

  const filteredDocuments = documents?.filter((doc: any) =>
    searchTerm.length > 0
      ? doc.title.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      processed: "bg-green-500/20 text-green-400 border-green-500/30",
      processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      failed: "bg-red-500/20 text-red-400 border-red-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    };

    return (
      <Badge variant="outline" className={variants[status] || ""}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate all files first
    const invalidFiles = fileArray.filter(
      file => file.type !== "application/pdf" || file.size > 10 * 1024 * 1024
    );

    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} file(s) rejected: Only PDF files under 10MB are supported`);
      return;
    }

    toast.info(`Uploading ${fileArray.length} document(s)...`);

    let successCount = 0;
    let failCount = 0;

    // Process all files in parallel
    const uploadPromises = fileArray.map(async (file) => {
      try {
        // Step 1: Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        // Step 2: Upload file to Convex storage
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file");
        }

        const { storageId } = await uploadResponse.json();

        // Step 3: Create document record
        const documentId = await createDocument({
          title: file.name.replace(".pdf", ""),
          jurisdiction: "General",
          fileId: storageId,
          metadata: {
            documentType: "Legal Document",
            version: "1.0",
            fileSize: file.size,
          },
        });

        // Step 4: Process document with RAG backend (async, don't wait)
        processDocumentWithRAG({
          documentId,
          fileUrl: storageId,
          title: file.name.replace(".pdf", ""),
        }).catch(err => {
          console.error(`RAG processing failed for ${file.name}:`, err);
        });

        successCount++;
        return { success: true, fileName: file.name };
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        failCount++;
        return { success: false, fileName: file.name, error };
      }
    });

    await Promise.all(uploadPromises);

    // Show summary toast
    if (successCount > 0 && failCount === 0) {
      toast.success(`All ${successCount} document(s) uploaded successfully! Processing with AI...`);
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`${successCount} document(s) uploaded, ${failCount} failed`);
    } else {
      toast.error(`All ${failCount} document(s) failed to upload`);
    }

    // Reset file input
    event.target.value = "";
  };

  const handleViewDetails = (doc: any) => {
    setSelectedDocument(doc);
  };

  const getFileUrl = useQuery(
    api.documents.getFileUrl,
    selectedDocument ? { storageId: selectedDocument.fileId } : "skip"
  );

  const handleDownloadDocument = async (doc: any) => {
    try {
      if (!doc.fileId) {
        toast.error("No file associated with this document");
        return;
      }

      // The file URL is already fetched via useQuery when selectedDocument is set
      if (getFileUrl) {
        toast.success("Download started");
        window.open(getFileUrl, '_blank');
      } else {
        toast.error("Unable to retrieve file URL");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  const handleUseInCaseAnalysis = (doc: any) => {
    if (doc.status !== "processed") {
      toast.error("Document must be processed before use in analysis");
      return;
    }
    
    // Navigate to Case Prediction page with document ID in state
    navigate("/case-prediction", { state: { selectedDocumentId: doc._id } });
    toast.success(`Document "${doc.title}" ready for case analysis`);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-light mb-2 text-foreground tracking-tight" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, letterSpacing: '-0.02em' }}>Document Library</h1>
        <p className="text-muted-foreground font-light" style={{ letterSpacing: '0.01em' }}>
          Upload and manage your legal documents for AI analysis
        </p>
      </motion.div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="macos-card p-8 border-dashed border-2 hover:border-primary/50 macos-transition">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 neon-glow">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">Upload Legal Documents</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop PDF files here, or click to browse (Max 10MB each, multiple files supported)
            </p>
            <label htmlFor="file-upload" className="cursor-pointer inline-block">
              <Button type="button" className="neon-glow pointer-events-none">
                <Upload className="h-4 w-4 mr-2" />
                Select Files
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept="application/pdf"
              onChange={handleUpload}
              className="hidden"
              multiple
            />
          </div>
        </Card>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Card className="macos-card p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 macos-vibrancy"
              />
            </div>
            <Button variant="outline" className="macos-vibrancy">
              <MapPin className="h-4 w-4 mr-2" />
              Filter by Jurisdiction
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Documents Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="macos-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Document</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments?.map((doc: any, index: number) => (
                <motion.tr
                  key={doc._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-border/50 hover:bg-primary/5 macos-transition"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        {doc.metadata && (
                          <p className="text-xs text-muted-foreground">
                            {doc.metadata.documentType} • v{doc.metadata.version}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{doc.jurisdiction}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(doc.status)}
                      {getStatusBadge(doc.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="macos-button"
                          onClick={() => handleViewDetails(doc)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="macos-card w-full sm:max-w-xl overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Document Details
                          </SheetTitle>
                          <SheetDescription>
                            Complete information about this document
                          </SheetDescription>
                        </SheetHeader>

                        {selectedDocument && (
                          <div className="mt-6 space-y-6">
                            {/* Document Info */}
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Title</label>
                                <p className="text-lg font-semibold mt-1">{selectedDocument.title}</p>
                              </div>

                              <Separator />

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Jurisdiction</label>
                                  <p className="mt-1">
                                    <Badge variant="secondary">{selectedDocument.jurisdiction}</Badge>
                                  </p>
                                </div>

                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                                  <p className="mt-1 flex items-center gap-2">
                                    {getStatusIcon(selectedDocument.status)}
                                    {getStatusBadge(selectedDocument.status)}
                                  </p>
                                </div>
                              </div>

                              <Separator />

                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Upload Date</label>
                                <p className="mt-1 flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(selectedDocument.uploadDate).toLocaleString()}
                                </p>
                              </div>

                              {selectedDocument.metadata && (
                                <>
                                  <Separator />
                                  
                                  <div className="space-y-3">
                                    <h4 className="font-medium">Metadata</h4>
                                    
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div className="bg-muted/50 p-3 rounded-lg">
                                        <label className="text-xs text-muted-foreground">Document Type</label>
                                        <p className="font-medium mt-1">{selectedDocument.metadata.documentType}</p>
                                      </div>

                                      <div className="bg-muted/50 p-3 rounded-lg">
                                        <label className="text-xs text-muted-foreground">Version</label>
                                        <p className="font-medium mt-1">{selectedDocument.metadata.version}</p>
                                      </div>

                                      {selectedDocument.metadata.pageCount && (
                                        <div className="bg-muted/50 p-3 rounded-lg">
                                          <label className="text-xs text-muted-foreground">Pages</label>
                                          <p className="font-medium mt-1">{selectedDocument.metadata.pageCount}</p>
                                        </div>
                                      )}

                                      {selectedDocument.metadata.fileSize && (
                                        <div className="bg-muted/50 p-3 rounded-lg">
                                          <label className="text-xs text-muted-foreground">File Size</label>
                                          <p className="font-medium mt-1">
                                            {(selectedDocument.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}

                              <Separator />

                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Document ID</label>
                                <p className="mt-1 text-xs font-mono bg-muted/50 p-2 rounded">
                                  {selectedDocument._id}
                                </p>
                              </div>

                              {selectedDocument.fileId && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Storage ID</label>
                                  <p className="mt-1 text-xs font-mono bg-muted/50 p-2 rounded">
                                    {selectedDocument.fileId}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="space-y-2 pt-4">
                              <Button 
                                className="w-full neon-glow"
                                disabled={selectedDocument.status !== "processed"}
                                onClick={() => handleUseInCaseAnalysis(selectedDocument)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Use in Case Analysis
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                className="w-full macos-vibrancy"
                                onClick={() => handleDownloadDocument(selectedDocument)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Document
                              </Button>
                            </div>
                          </div>
                        )}
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>

          {(!filteredDocuments || filteredDocuments.length === 0) && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Upload your first legal document to get started
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}