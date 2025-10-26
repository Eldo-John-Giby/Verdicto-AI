import { v } from "convex/values";
import { action, mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || "https://verdicto-ai-1-production-3dbc.up.railway.app";

/**
 * Compare multiple documents and detect conflicts
 */
export const compareDocuments = action({
  args: {
    documentIds: v.array(v.id("documents")),
  },
  handler: async (ctx, args): Promise<any> => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not authenticated");

      // Create comparison record
      const comparisonId = await ctx.runMutation(internal.comparison.createComparisonInternal, {
        userId,
        documentIds: args.documentIds,
      });

      // Get document contents
      const documents = [];
      for (const docId of args.documentIds) {
        const doc = await ctx.runQuery(internal.documents.getByIdInternal, {
          documentId: docId,
        });
        if (doc) {
          const fileUrl = await ctx.storage.getUrl(doc.fileId);
          documents.push({
            id: docId,
            title: doc.title,
            fileUrl,
            chunks: doc.chunks || [],
          });
        }
      }

      // Call RAG backend for comparison analysis
      const response = await fetch(`${RAG_BACKEND_URL}/api/v1/documents/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 8ad62148045cbf8137a66e1d8c0974e14f62a970b4fa91afb850f461abfbadb8",
        },
        body: JSON.stringify({
          query: `Compare these ${documents.length} legal documents and identify:
1. CONTRADICTIONS: Statements that directly oppose each other
2. INCONSISTENCIES: Different values, terms, or definitions for the same concept
3. MISSING CLAUSES: Important clauses present in some documents but not others
4. CONFLICTING TERMS: Different interpretations or conditions

For each conflict found, provide:
- Type (contradiction/inconsistency/missing_clause/conflicting_terms)
- Severity (critical/high/medium/low)
- Description (what the conflict is)
- Affected documents with page numbers and excerpts
- Recommendation (how to resolve)

Also calculate an overall risk score (0-100) based on severity and number of conflicts.

Format as JSON:
{
  "conflicts": [
    {
      "type": "contradiction",
      "severity": "high",
      "description": "...",
      "affectedDocuments": [{"documentIndex": 0, "page": 1, "excerpt": "..."}],
      "recommendation": "..."
    }
  ],
  "overallRiskScore": 75
}

Documents to compare: ${documents.map((d, i) => `[${i}] ${d.title}`).join(', ')}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG backend error: ${response.statusText}`);
      }

      const result = await response.json();
      const ragResponse = result.answer || "";

      // Parse conflicts from response
      const { conflicts, overallRiskScore } = parseConflicts(ragResponse, documents);

      // Update comparison with results
      await ctx.runMutation(internal.comparison.updateComparisonInternal, {
        comparisonId,
        conflicts,
        overallRiskScore,
        status: "completed",
      });

      return {
        success: true,
        comparisonId,
        conflicts,
        overallRiskScore,
      };
    } catch (error) {
      console.error("Document comparison error:", error);
      throw new Error(`Failed to compare documents: ${error}`);
    }
  },
});

/**
 * Get comparison results by ID
 */
export const getComparison = query({
  args: {
    comparisonId: v.id("documentComparisons"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const comparison = await ctx.db.get(args.comparisonId);
    if (!comparison || comparison.userId !== userId) return null;

    // Get document details
    const documents = [];
    for (const docId of comparison.documentIds) {
      const doc = await ctx.db.get(docId);
      if (doc) {
        documents.push({
          _id: doc._id,
          title: doc.title,
          jurisdiction: doc.jurisdiction,
        });
      }
    }

    return {
      ...comparison,
      documents,
    };
  },
});

/**
 * Get all comparisons for current user
 */
export const getUserComparisons = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const comparisons = await ctx.db
      .query("documentComparisons")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get document titles for each comparison
    const enrichedComparisons = [];
    for (const comp of comparisons) {
      const documents = [];
      for (const docId of comp.documentIds) {
        const doc = await ctx.db.get(docId);
        if (doc) documents.push(doc.title);
      }
      enrichedComparisons.push({
        ...comp,
        documentTitles: documents,
      });
    }

    return enrichedComparisons.sort((a, b) => b.comparisonDate - a.comparisonDate);
  },
});

/**
 * Delete a comparison
 */
export const deleteComparison = mutation({
  args: {
    comparisonId: v.id("documentComparisons"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comparison = await ctx.db.get(args.comparisonId);
    if (!comparison || comparison.userId !== userId) {
      throw new Error("Comparison not found or unauthorized");
    }

    await ctx.db.delete(args.comparisonId);
  },
});

/**
 * Internal mutation to create comparison record
 */
export const createComparisonInternal = internalMutation({
  args: {
    userId: v.id("users"),
    documentIds: v.array(v.id("documents")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documentComparisons", {
      userId: args.userId,
      documentIds: args.documentIds,
      comparisonDate: Date.now(),
      conflicts: [],
      overallRiskScore: 0,
      status: "processing",
    });
  },
});

/**
 * Internal mutation to update comparison results
 */
export const updateComparisonInternal = internalMutation({
  args: {
    comparisonId: v.id("documentComparisons"),
    conflicts: v.any(),
    overallRiskScore: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.comparisonId, {
      conflicts: args.conflicts,
      overallRiskScore: args.overallRiskScore,
      status: args.status,
    });
  },
});

// Helper function to parse conflicts from RAG response
function parseConflicts(response: string, documents: any[]): { conflicts: any[], overallRiskScore: number } {
  let conflicts: any[] = [];
  let overallRiskScore = 0;

  try {
    // Try to parse as JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      conflicts = (parsed.conflicts || []).map((conflict: any) => ({
        type: conflict.type || "inconsistency",
        severity: conflict.severity || "medium",
        description: conflict.description || "",
        affectedDocuments: (conflict.affectedDocuments || []).map((doc: any) => ({
          documentId: documents[doc.documentIndex]?.id || documents[0]?.id,
          page: doc.page || 1,
          excerpt: doc.excerpt || "",
        })),
        recommendation: conflict.recommendation || "Review and resolve manually",
      }));
      overallRiskScore = parsed.overallRiskScore || 50;
    }
  } catch (e) {
    // Fallback
  }

  // If no conflicts parsed, create a default analysis
  if (conflicts.length === 0) {
    conflicts = [
      {
        type: "inconsistency",
        severity: "medium",
        description: "Automated comparison completed. Manual review recommended for detailed analysis.",
        affectedDocuments: documents.slice(0, 2).map(d => ({
          documentId: d.id,
          page: 1,
          excerpt: "Full document review required",
        })),
        recommendation: "Conduct detailed manual review of all documents",
      }
    ];
    overallRiskScore = 30;
  }

  return { conflicts, overallRiskScore };
}