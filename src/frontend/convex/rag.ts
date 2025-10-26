"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || "https://verdicto-ai-1-production-3dbc.up.railway.app";

/**
 * Send document to RAG backend for processing using dedicated ingest endpoint
 */
export const processDocument = action({
  args: {
    documentId: v.id("documents"),
    fileUrl: v.id("_storage"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Update document status to processing
      await ctx.runMutation(internal.documents.updateStatus, {
        documentId: args.documentId,
        status: "processing",
      });

      // Get the actual URL from Convex storage
      const actualFileUrl = await ctx.storage.getUrl(args.fileUrl);
      
      if (!actualFileUrl) {
        throw new Error("Failed to get file URL from storage");
      }

      // Use dedicated ingest endpoint
      const response = await fetch(`${RAG_BACKEND_URL}/api/v1/documents/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 8ad62148045cbf8137a66e1d8c0974e14f62a970b4fa91afb850f461abfbadb8",
        },
        body: JSON.stringify({
          document_url: actualFileUrl,
          document_id: args.documentId,
          title: args.title,
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG backend error: ${response.statusText}`);
      }

      const result = await response.json();

      // Update document status to processed
      await ctx.runMutation(internal.documents.updateStatus, {
        documentId: args.documentId,
        status: "processed",
      });

      return {
        success: true,
        message: "Document processed successfully",
        chunks: result.chunks_processed || 0,
      };
    } catch (error) {
      // Update document status to failed
      await ctx.runMutation(internal.documents.updateStatus, {
        documentId: args.documentId,
        status: "failed",
      });

      console.error("RAG processing error:", error);
      throw new Error(`Failed to process document: ${error}`);
    }
  },
});

/**
 * Send query to RAG backend for analysis using dedicated query endpoint
 */
export const analyzeQuery = action({
  args: {
    queryId: v.id("queries"),
    queryText: v.string(),
    documentIds: v.optional(v.array(v.id("documents"))),
  },
  handler: async (ctx, args): Promise<{ success: boolean; predictionId: any; response: string }> => {
    try {
      // Update query status to processing
      await ctx.runMutation(internal.queries.updateStatus, {
        queryId: args.queryId,
        status: "processing",
      });

      // Get document ID if provided
      let documentId = undefined;
      if (args.documentIds && args.documentIds.length > 0) {
        documentId = args.documentIds[0];
      }

      // Send to RAG backend for analysis using dedicated query endpoint
      const response = await fetch(`${RAG_BACKEND_URL}/api/v1/documents/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 8ad62148045cbf8137a66e1d8c0974e14f62a970b4fa91afb850f461abfbadb8",
        },
        body: JSON.stringify({
          query: args.queryText,
          document_id: documentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG backend error: ${response.statusText}`);
      }

      const result = await response.json();

      // Extract RAG results
      const ragResponse = result.answer || "No response generated";
      
      // Calculate dynamic confidence based on response quality
      // Factors: response length, presence of specific legal terms, structure
      let confidence = 0.5; // Base confidence
      
      if (ragResponse && ragResponse.length > 100) {
        confidence += 0.1; // Longer, more detailed responses
      }
      if (ragResponse && ragResponse.length > 300) {
        confidence += 0.1; // Very detailed responses
      }
      
      // Check for legal terminology and structure
      const legalTerms = ['section', 'act', 'court', 'case', 'law', 'legal', 'pursuant', 'hereby', 'whereas'];
      const termsFound = legalTerms.filter(term => 
        ragResponse.toLowerCase().includes(term)
      ).length;
      
      if (termsFound >= 3) {
        confidence += 0.15; // Contains multiple legal terms
      } else if (termsFound >= 1) {
        confidence += 0.05; // Contains some legal terms
      }
      
      // Cap confidence at 0.95 (never 100% certain)
      confidence = Math.min(confidence, 0.95);

      // Create prediction in Convex with RAG results
      const predictionId: any = await ctx.runMutation(internal.predictions.createFromRAG, {
        queryId: args.queryId,
        ragResponse,
        confidence,
        sources: [],
      });

      // Update query status to completed
      await ctx.runMutation(internal.queries.updateStatus, {
        queryId: args.queryId,
        status: "completed",
      });

      return {
        success: true,
        predictionId,
        response: ragResponse,
      };
    } catch (error) {
      // Update query status to failed
      await ctx.runMutation(internal.queries.updateStatus, {
        queryId: args.queryId,
        status: "failed",
      });

      console.error("RAG analysis error:", error);
      throw new Error(`Failed to analyze query: ${error}`);
    }
  },
});

/**
 * Search documents using RAG backend's dedicated search endpoint
 */
export const searchDocuments = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${RAG_BACKEND_URL}/api/v1/documents/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 8ad62148045cbf8137a66e1d8c0974e14f62a970b4fa91afb850f461abfbadb8",
        },
        body: JSON.stringify({
          query: args.query,
          limit: args.limit || 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG backend error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.results || [];
    } catch (error) {
      console.error("RAG search error:", error);
      return [];
    }
  },
});

/**
 * Generate structured notes from transcript using RAG backend
 */
export const generateNotes = action({
  args: {
    transcript: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Create a query for note generation
      const response = await fetch(`${RAG_BACKEND_URL}/api/v1/documents/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 8ad62148045cbf8137a66e1d8c0974e14f62a970b4fa91afb850f461abfbadb8",
        },
        body: JSON.stringify({
          query: `Analyze the following court proceedings transcript and provide:
1. Extract 5-8 key points as bullet points (each point should be concise and specific)
2. Generate a comprehensive summary paragraph (3-4 sentences) that captures the essence of the proceedings

Format your response as:
KEY POINTS:
- [point 1]
- [point 2]
...

SUMMARY:
[comprehensive summary paragraph]

Transcript: ${args.transcript}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG backend error: ${response.statusText}`);
      }

      const result = await response.json();
      const ragResponse = result.answer || "";

      // Parse the response to extract bullet points and summary
      const bulletPoints = extractBulletPoints(ragResponse);
      const aiSummary = extractSummary(ragResponse);

      return {
        success: true,
        bulletPoints,
        aiSummary,
        rawResponse: ragResponse,
      };
    } catch (error) {
      console.error("Note generation error:", error);
      throw new Error(`Failed to generate notes: ${error}`);
    }
  },
});

// Helper function to extract bullet points from RAG response
function extractBulletPoints(response: string): string[] {
  const bulletPoints: string[] = [];
  
  // Look for KEY POINTS section
  const keyPointsMatch = response.match(/KEY POINTS:?\s*([\s\S]*?)(?=SUMMARY:|$)/i);
  
  if (keyPointsMatch) {
    const pointsText = keyPointsMatch[1];
    // Extract lines starting with -, *, or numbers
    const lines = pointsText.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[-*•]\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/)) {
        const point = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
        if (point) bulletPoints.push(point);
      }
    }
  }
  
  // Fallback: if no structured points found, create from sentences
  if (bulletPoints.length === 0) {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20);
    bulletPoints.push(...sentences.slice(0, 5).map(s => s.trim()));
  }
  
  return bulletPoints.slice(0, 8); // Limit to 8 points
}

// Helper function to extract summary from RAG response
function extractSummary(response: string): string {
  // Look for SUMMARY section
  const summaryMatch = response.match(/SUMMARY:?\s*([\s\S]+?)$/i);
  
  if (summaryMatch) {
    return summaryMatch[1].trim();
  }
  
  // Fallback: use first 3-4 sentences
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, 3).join('. ') + '.';
}