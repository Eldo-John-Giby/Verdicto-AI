"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * ML Bias Analysis Actions
 * 
 * These actions connect to the unified ML backend for bias detection
 * and outcome prediction using InLegalBERT.
 */

const ML_API_URL = process.env.ML_API_URL || "https://a-i-c-a-verdicto-ml.hf.space";

export const analyzeComprehensive = action({
  args: {
    caseText: v.string(),
    ragSummary: v.optional(v.string()),
    sourceDocuments: v.optional(v.array(v.string())),
    historicalCases: v.optional(v.any()),
    caseMetadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${ML_API_URL}/api/v1/analyze/comprehensive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_text: args.caseText,
          rag_summary: args.ragSummary,
          source_documents: args.sourceDocuments,
          historical_cases: args.historicalCases,
          case_metadata: args.caseMetadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Comprehensive analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Comprehensive analysis error: ${error}`);
    }
  },
});

export const analyzeSystemicBias = action({
  args: {
    historicalCases: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${ML_API_URL}/api/v1/analyze/systemic-bias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          historical_cases: args.historicalCases,
        }),
      });

      if (!response.ok) {
        throw new Error(`Systemic bias analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Systemic bias analysis error: ${error}`);
    }
  },
});