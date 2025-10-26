import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // User profiles
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"), v.literal("member"))),
    viewMode: v.optional(v.union(v.literal("citizen"), v.literal("lawyer"))),
    preferredLanguage: v.optional(v.string()),
  }).index("email", ["email"]),

  // Legal cases database
  cases: defineTable({
    caseNumber: v.string(),
    title: v.string(),
    description: v.string(),
    outcome: v.string(),
    jurisdiction: v.string(),
    year: v.number(),
    category: v.string(),
    tags: v.array(v.string()),
  }).index("by_category", ["category"]),

  // Document management for RAG
  documents: defineTable({
    userId: v.id("users"),
    title: v.string(),
    uploadDate: v.number(),
    jurisdiction: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("processed"),
      v.literal("failed")
    ),
    fileId: v.id("_storage"),
    metadata: v.optional(
      v.object({
        documentType: v.string(),
        version: v.string(),
        pageCount: v.optional(v.number()),
        fileSize: v.optional(v.number()),
      })
    ),
    chunks: v.optional(v.array(v.object({
      page: v.number(),
      paragraph: v.number(),
      content: v.string(),
    }))),
    timelineEvents: v.optional(v.array(v.object({
      date: v.string(),
      eventType: v.string(),
      description: v.string(),
      importance: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
      sourceReference: v.object({
        page: v.number(),
        excerpt: v.string(),
      }),
    }))),
  })
    .index("by_user", ["userId"])
    .index("by_jurisdiction", ["jurisdiction"])
    .index("by_status", ["status"]),

  // Document comparisons for conflict detection
  documentComparisons: defineTable({
    userId: v.id("users"),
    documentIds: v.array(v.id("documents")),
    comparisonDate: v.number(),
    conflicts: v.array(v.object({
      type: v.string(),
      severity: v.string(),
      description: v.string(),
      affectedDocuments: v.array(v.object({
        documentId: v.id("documents"),
        page: v.number(),
        excerpt: v.string(),
      })),
      recommendation: v.string(),
    })),
    overallRiskScore: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  })
    .index("by_user", ["userId"]),

  // User queries
  queries: defineTable({
    userId: v.id("users"),
    queryText: v.string(),
    uploadedFiles: v.optional(v.array(v.id("_storage"))),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    language: v.optional(v.string()),
    viewMode: v.optional(v.union(v.literal("citizen"), v.literal("lawyer"))),
    documentIds: v.optional(v.array(v.id("documents"))),
  }).index("by_user", ["userId"]),

  // AI predictions
  predictions: defineTable({
    queryId: v.id("queries"),
    userId: v.id("users"),
    prediction: v.string(),
    confidenceScore: v.number(),
    confidenceLevel: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    reasoning: v.string(),
    relatedCases: v.optional(v.array(v.id("cases"))),
    biasFlags: v.optional(v.array(v.object({
      type: v.string(),
      severity: v.string(),
      description: v.string(),
    }))),
    evidenceSnippets: v.optional(v.array(v.object({
      caseId: v.optional(v.id("cases")),
      snippet: v.string(),
      relevance: v.number(),
    }))),
    sourceReferences: v.optional(v.array(v.object({
      documentId: v.optional(v.id("documents")),
      page: v.optional(v.number()),
      paragraph: v.optional(v.number()),
      excerpt: v.string(),
    }))),
    disclaimers: v.optional(v.array(v.string())),
  })
    .index("by_query", ["queryId"])
    .index("by_user", ["userId"]),

  // Bias analysis reports
  biasReports: defineTable({
    predictionId: v.id("predictions"),
    userId: v.id("users"),
    overallScore: v.number(),
    categories: v.object({
      racial: v.optional(v.number()),
      gender: v.optional(v.number()),
      socioeconomic: v.optional(v.number()),
      geographic: v.optional(v.number()),
      age: v.optional(v.number()),
    }),
    recommendations: v.array(v.string()),
  })
    .index("by_prediction", ["predictionId"])
    .index("by_user", ["userId"]),

  // Live verdict notes
  verdictNotes: defineTable({
    userId: v.id("users"),
    title: v.string(),
    transcript: v.string(),
    bulletPoints: v.array(v.string()),
    aiSummary: v.string(),
    timestamp: v.number(),
  }).index("by_user", ["userId"]),
});