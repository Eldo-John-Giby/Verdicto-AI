import { v } from "convex/values";
import { action, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || "https://verdicto-ai-1-production-3dbc.up.railway.app";

/**
 * Extract timeline events from a document using RAG backend
 */
export const extractTimelineEvents = action({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    try {
      // Get document details
      const document = await ctx.runQuery(internal.documents.getByIdInternal, {
        documentId: args.documentId,
      });

      if (!document) {
        throw new Error("Document not found");
      }

      // Get file URL
      const fileUrl = await ctx.storage.getUrl(document.fileId);
      if (!fileUrl) {
        throw new Error("Failed to get file URL");
      }

      // Call RAG backend to extract timeline events
      const response = await fetch(`${RAG_BACKEND_URL}/api/v1/documents/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 8ad62148045cbf8137a66e1d8c0974e14f62a970b4fa91afb850f461abfbadb8",
        },
        body: JSON.stringify({
          query: `Analyze this legal document and extract ALL timeline events in chronological order. For each event, provide:
1. Exact date (format: YYYY-MM-DD or as specific as available)
2. Event type (filing, hearing, judgment, deadline, motion, order, notice, or other)
3. Brief description (1-2 sentences)
4. Importance level (high, medium, or low based on legal significance)
5. Page number and relevant excerpt

Format your response as a JSON array:
[
  {
    "date": "YYYY-MM-DD",
    "eventType": "filing",
    "description": "Brief description",
    "importance": "high",
    "page": 1,
    "excerpt": "Relevant text excerpt"
  }
]

Document: ${document.title}`,
          document_id: args.documentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG backend error: ${response.statusText}`);
      }

      const result = await response.json();
      const ragResponse = result.answer || "";

      // Parse timeline events from response
      const timelineEvents = parseTimelineEvents(ragResponse);

      // Update document with timeline events
      await ctx.runMutation(internal.timeline.updateDocumentTimeline, {
        documentId: args.documentId,
        timelineEvents,
      });

      return {
        success: true,
        events: timelineEvents,
      };
    } catch (error) {
      console.error("Timeline extraction error:", error);
      throw new Error(`Failed to extract timeline: ${error}`);
    }
  },
});

/**
 * Get timeline events for a specific document
 */
export const getDocumentTimeline = action({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const document: any = await ctx.runQuery(internal.documents.getByIdInternal, {
      documentId: args.documentId,
    });

    if (!document || !document.timelineEvents) {
      return [];
    }

    return document.timelineEvents.map((event: any) => ({
      ...event,
      documentId: args.documentId,
      documentTitle: document.title,
    }));
  },
});

/**
 * Get merged timeline from multiple documents
 */
export const getMultiDocumentTimeline = action({
  args: {
    documentIds: v.array(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const allEvents: any[] = [];

    for (const docId of args.documentIds) {
      const document = await ctx.runQuery(internal.documents.getByIdInternal, {
        documentId: docId,
      });

      if (document && document.timelineEvents) {
        const eventsWithDocInfo = document.timelineEvents.map((event: any) => ({
          ...event,
          documentId: docId,
          documentTitle: document.title,
        }));
        allEvents.push(...eventsWithDocInfo);
      }
    }

    // Sort by date
    allEvents.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    return allEvents;
  },
});

/**
 * Internal mutation to update document timeline
 */
export const updateDocumentTimeline = internalMutation({
  args: {
    documentId: v.id("documents"),
    timelineEvents: v.array(v.object({
      date: v.string(),
      eventType: v.string(),
      description: v.string(),
      importance: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
      sourceReference: v.object({
        page: v.number(),
        excerpt: v.string(),
      }),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      timelineEvents: args.timelineEvents,
    });
  },
});

// Helper function to parse timeline events from RAG response
function parseTimelineEvents(response: string): any[] {
  const events: any[] = [];

  try {
    // Try to parse as JSON first
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((event: any) => ({
        date: event.date || "Unknown",
        eventType: event.eventType || "other",
        description: event.description || "",
        importance: event.importance || "medium",
        sourceReference: {
          page: event.page || 1,
          excerpt: event.excerpt || "",
        },
      }));
    }
  } catch (e) {
    // Fallback to text parsing
  }

  // Fallback: parse from text format
  const lines = response.split('\n');
  let currentEvent: any = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Look for date patterns
    const dateMatch = trimmed.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/);
    if (dateMatch) {
      if (currentEvent) events.push(currentEvent);
      currentEvent = {
        date: dateMatch[1],
        eventType: "other",
        description: trimmed,
        importance: "medium",
        sourceReference: { page: 1, excerpt: trimmed },
      };
    }

    // Look for event types
    if (currentEvent && /filing|hearing|judgment|deadline|motion|order|notice/i.test(trimmed)) {
      const typeMatch = trimmed.match(/\b(filing|hearing|judgment|deadline|motion|order|notice)\b/i);
      if (typeMatch) currentEvent.eventType = typeMatch[1].toLowerCase();
    }
  }

  if (currentEvent) events.push(currentEvent);

  return events.length > 0 ? events : [
    {
      date: new Date().toISOString().split('T')[0],
      eventType: "other",
      description: "No timeline events extracted. Please ensure document contains dates and legal events.",
      importance: "low",
      sourceReference: { page: 1, excerpt: "" },
    }
  ];
}