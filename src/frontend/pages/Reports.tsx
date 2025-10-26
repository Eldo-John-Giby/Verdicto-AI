import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export default function Reports() {
  const predictions = useQuery(api.predictions.listByUser);

  const handleDownload = (prediction: any, index: number) => {
    try {
      // Create a printable HTML document
      const reportContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Case Analysis Report #${index + 1}</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            h1 {
              color: #1a1a1a;
              border-bottom: 3px solid #000;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            h2 {
              color: #2a2a2a;
              margin-top: 30px;
              margin-bottom: 15px;
              border-left: 4px solid #000;
              padding-left: 15px;
            }
            .metadata {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .metadata p {
              margin: 5px 0;
            }
            .confidence-badge {
              display: inline-block;
              padding: 5px 15px;
              border-radius: 20px;
              font-weight: bold;
              margin: 10px 0;
            }
            .confidence-high { background: #dcfce7; color: #166534; }
            .confidence-medium { background: #fef3c7; color: #92400e; }
            .confidence-low { background: #fee2e2; color: #991b1b; }
            .bias-flag {
              background: #fef2f2;
              border-left: 4px solid #dc2626;
              padding: 10px 15px;
              margin: 10px 0;
              border-radius: 4px;
            }
            .evidence-snippet {
              background: #f0f9ff;
              border-left: 4px solid #0284c7;
              padding: 10px 15px;
              margin: 10px 0;
              border-radius: 4px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>Case Analysis Report #${index + 1}</h1>
          
          <div class="metadata">
            <p><strong>Generated:</strong> ${new Date(prediction._creationTime).toLocaleString()}</p>
            <p><strong>Confidence Score:</strong> ${Math.round(prediction.confidenceScore * 100)}%</p>
            <p><strong>Confidence Level:</strong> ${prediction.confidenceLevel || 'N/A'}</p>
            <p><strong>Bias Flags:</strong> ${prediction.biasFlags?.length || 0}</p>
          </div>

          <h2>Prediction</h2>
          <p>${prediction.prediction || 'No prediction available'}</p>

          <h2>Reasoning</h2>
          <p>${prediction.reasoning || 'No reasoning provided'}</p>

          ${prediction.biasFlags && prediction.biasFlags.length > 0 ? `
            <h2>Bias Flags Detected</h2>
            ${prediction.biasFlags.map((flag: any) => `
              <div class="bias-flag">
                <strong>${flag.type || 'Unknown'}</strong> (${flag.severity || 'N/A'})<br>
                ${flag.description || 'No description'}
              </div>
            `).join('')}
          ` : ''}

          ${prediction.evidenceSnippets && prediction.evidenceSnippets.length > 0 ? `
            <h2>Evidence Snippets</h2>
            ${prediction.evidenceSnippets.map((snippet: any) => `
              <div class="evidence-snippet">
                <strong>Relevance:</strong> ${snippet.relevance || 'N/A'}<br>
                ${snippet.snippet || 'No snippet available'}
              </div>
            `).join('')}
          ` : ''}

          <h2>Disclaimers</h2>
          <p>${prediction.disclaimers || 'This analysis is provided for informational purposes only and should not be considered as legal advice. Please consult with a qualified legal professional for specific legal matters.'}</p>
        </body>
        </html>
      `;

      // Create a new window and print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load then trigger print
        setTimeout(() => {
          printWindow.print();
          toast.success("Report ready for download");
        }, 250);
      } else {
        toast.error("Please allow pop-ups to download the report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-light mb-2 text-foreground tracking-tight" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, letterSpacing: '-0.02em' }}>Reports</h1>
        <p className="text-muted-foreground font-light" style={{ letterSpacing: '0.01em' }}>
          Download and review your analysis reports
        </p>
      </motion.div>

      <div className="space-y-4">
        {predictions?.map((prediction: any, index: number) => (
          <motion.div
            key={prediction._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="glass-strong p-6 hover:neon-glow transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">
                      Case Analysis Report #{index + 1}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(prediction._creationTime).toLocaleDateString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Confidence: {Math.round(prediction.confidenceScore * 100)}% •{" "}
                      {prediction.biasFlags?.length || 0} bias flags
                    </p>
                  </div>
                </div>
                <Button onClick={() => handleDownload(prediction, index)} className="neon-glow">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {(!predictions || predictions.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No reports available yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Complete case predictions to generate reports
          </p>
        </motion.div>
      )}
    </div>
  );
}