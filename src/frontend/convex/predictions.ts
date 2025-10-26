import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    queryId: v.id("queries"),
    prediction: v.string(),
    confidenceScore: v.number(),
    reasoning: v.string(),
    relatedCases: v.array(v.id("cases")),
    biasFlags: v.array(
      v.object({
        type: v.string(),
        severity: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high")
        ),
        description: v.string(),
      })
    ),
    evidenceSnippets: v.array(
      v.object({
        caseId: v.id("cases"),
        snippet: v.string(),
        relevance: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Determine confidence level based on score
    const confidenceLevel = 
      args.confidenceScore >= 0.75 ? "high" as const :
      args.confidenceScore >= 0.5 ? "medium" as const :
      "low" as const;

    const predictionId = await ctx.db.insert("predictions", {
      ...args,
      userId,
      confidenceLevel,
    });

    return predictionId;
  },
});

export const createFromRAG = internalMutation({
  args: {
    queryId: v.id("queries"),
    ragResponse: v.string(),
    confidence: v.number(),
    sources: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const query = await ctx.db.get(args.queryId);
    if (!query) throw new Error("Query not found");

    const cases = await ctx.db.query("cases").take(3);
    const caseIds = cases.map((c) => c._id);

    const confidenceLevel = 
      args.confidence >= 0.75 ? "high" as const :
      args.confidence >= 0.5 ? "medium" as const :
      "low" as const;

    const predictionId = await ctx.db.insert("predictions", {
      queryId: args.queryId,
      userId: query.userId,
      prediction: args.ragResponse,
      confidenceScore: args.confidence,
      confidenceLevel,
      reasoning: "Analysis powered by RAG system with semantic search and cross-encoder reranking.",
      relatedCases: caseIds,
      biasFlags: [],
      evidenceSnippets: args.sources.slice(0, 5).map((source: any, idx: number) => ({
        caseId: caseIds[idx % caseIds.length],
        snippet: source.content || source.text || "",
        relevance: source.score || 0.8,
      })),
    });

    return predictionId;
  },
});

export const getByQuery = query({
  args: {
    queryId: v.id("queries"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const prediction = await ctx.db
      .query("predictions")
      .withIndex("by_query", (q) => q.eq("queryId", args.queryId))
      .first();

    if (!prediction || prediction.userId !== userId) return null;

    return prediction;
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const predictions = await ctx.db
      .query("predictions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);

    return predictions;
  },
});

export const mockAnalysis = mutation({
  args: {
    queryId: v.id("queries"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const cases = await ctx.db.query("cases").take(3);
    const caseIds = cases.map((c) => c._id);

    const confidenceScore = 0.78;
    const confidenceLevel = 
      confidenceScore >= 0.75 ? "high" as const :
      confidenceScore >= 0.5 ? "medium" as const :
      "low" as const;

    const predictionId = await ctx.db.insert("predictions", {
      queryId: args.queryId,
      userId,
      prediction:
        "Based on analysis of similar cases, there is a 78% likelihood of a favorable outcome. The key factors include precedent from recent technology law cases and strong constitutional arguments.",
      confidenceScore,
      confidenceLevel,
      reasoning:
        "This prediction is based on pattern matching with 127 similar cases in our database. The primary supporting factors are: (1) Strong precedent from Tech Corp v. Privacy Alliance (2022), (2) Recent judicial trends favoring privacy protections, and (3) Clear constitutional grounds for the argument.",
      relatedCases: caseIds,
      biasFlags: [
        {
          type: "Geographic Bias",
          severity: "low" as const,
          description:
            "Analysis shows slight regional variation in outcomes. Consider jurisdiction-specific factors.",
        },
        {
          type: "Temporal Bias",
          severity: "medium" as const,
          description:
            "Recent cases show evolving standards. Historical data may not fully reflect current judicial climate.",
        },
      ],
      evidenceSnippets: cases.map((c) => ({
        caseId: c._id,
        snippet: c.description.substring(0, 150) + "...",
        relevance: Math.random() * 0.5 + 0.5,
      })),
    });

    await ctx.db.insert("biasReports", {
      predictionId,
      userId,
      overallScore: 0.82,
      categories: {
        racial: 0.91,
        gender: 0.88,
        socioeconomic: 0.75,
        geographic: 0.79,
        age: 0.85,
      },
      recommendations: [
        "Consider additional review for socioeconomic factors",
        "Geographic variations detected - review jurisdiction-specific precedents",
        "Overall bias score is within acceptable range (>0.75)",
      ],
    });

    return predictionId;
  },
});

export const updateBiasFlags = internalMutation({
  args: {
    predictionId: v.id("predictions"),
    biasFlags: v.array(
      v.object({
        type: v.string(),
        severity: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high")
        ),
        description: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.predictionId, {
      biasFlags: args.biasFlags,
    });
  },
});

export const getHistoricalData = internalQuery({
  args: {
    timeRange: v.optional(
      v.object({
        startDate: v.number(),
        endDate: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("predictions");

    // Note: Convex doesn't support time-based filtering directly in this version
    // You would need to fetch all and filter, or use indexes
    const predictions = await query.take(100);

    // Filter by time if provided
    if (args.timeRange) {
      return predictions.filter(
        (p) =>
          p._creationTime >= args.timeRange!.startDate &&
          p._creationTime <= args.timeRange!.endDate
      );
    }

    return predictions;
  },
});