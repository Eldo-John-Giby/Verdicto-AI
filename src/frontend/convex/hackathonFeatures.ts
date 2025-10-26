"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const ML_API_URL = process.env.ML_API_URL || "https://a-i-c-a-verdicto-ml.hf.space";

export const translateQuery = action({
  args: {
    text: v.string(),
    sourceLang: v.optional(v.string()),
    targetLang: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${ML_API_URL}/api/v1/translate/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: args.text,
          source_lang: args.sourceLang || "auto",
          target_lang: args.targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Translation error: ${error}`);
    }
  },
});

export const translateResponse = action({
  args: {
    text: v.string(),
    targetLang: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${ML_API_URL}/api/v1/translate/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: args.text,
          target_lang: args.targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Translation error: ${error}`);
    }
  },
});

export const getSupportedLanguages = action({
  args: {},
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${ML_API_URL}/api/v1/languages`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Get languages failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Get languages failed: ${error}`);
    }
  },
});

export const simplifyText = action({
  args: {
    legalText: v.string(),
    readingLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${ML_API_URL}/api/v1/simplify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          legal_text: args.legalText,
          reading_level: args.readingLevel || "simple",
        }),
      });

      if (!response.ok) {
        throw new Error(`Simplification failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Simplification error: ${error}`);
    }
  },
});

export const generateDocument = action({
  args: {
    documentType: v.string(),
    details: v.any(),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${ML_API_URL}/api/v1/generate/document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_type: args.documentType,
          details: args.details,
        }),
      });

      if (!response.ok) {
        throw new Error(`Document generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Document generation error: ${error}`);
    }
  },
});

export const getDocumentTemplates = action({
  args: {},
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${ML_API_URL}/api/v1/templates`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Get templates failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Get templates error: ${error}`);
    }
  },
});

export const simulateOutcome = action({
  args: {
    baseCase: v.any(),
    modifications: v.any(),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${ML_API_URL}/api/v1/simulate/outcome`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base_case: args.baseCase,
          modifications: args.modifications,
        }),
      });

      if (!response.ok) {
        throw new Error(`Simulation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Simulation error: ${error}`);
    }
  },
});

export const sensitivityAnalysis = action({
  args: {
    caseFacts: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${ML_API_URL}/api/v1/simulate/sensitivity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_facts: args.caseFacts,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sensitivity analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Sensitivity analysis error: ${error}`);
    }
  },
});