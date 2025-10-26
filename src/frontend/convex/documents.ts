import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    title: v.string(),
    jurisdiction: v.string(),
    fileId: v.id("_storage"),
    metadata: v.optional(
      v.object({
        documentType: v.string(),
        version: v.string(),
        pageCount: v.optional(v.number()),
        fileSize: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const documentId = await ctx.db.insert("documents", {
      userId,
      title: args.title,
      uploadDate: Date.now(),
      jurisdiction: args.jurisdiction,
      status: "pending",
      fileId: args.fileId,
      metadata: args.metadata,
    });

    return documentId;
  },
});

export const list = query({
  args: {
    jurisdiction: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let documentsQuery = ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    const documents = await documentsQuery.collect();

    let filtered = documents;
    if (args.jurisdiction) {
      filtered = filtered.filter((d) => d.jurisdiction === args.jurisdiction);
    }
    if (args.status) {
      filtered = filtered.filter((d) => d.status === args.status);
    }

    return filtered.sort((a, b) => b.uploadDate - a.uploadDate);
  },
});

export const updateStatus = internalMutation({
  args: {
    documentId: v.id("documents"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("processed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    await ctx.db.patch(args.documentId, { status: args.status });
  },
});

export const search = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const allDocuments = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    return allDocuments.filter(
      (d) =>
        d.title.toLowerCase().includes(searchLower) ||
        d.jurisdiction.toLowerCase().includes(searchLower)
    );
  },
});

export const getById = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const document = await ctx.db.get(args.documentId);
    if (!document || document.userId !== userId) return null;

    return document;
  },
});

export const getByIdInternal = internalQuery({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.storage.getUrl(args.storageId);
  },
});