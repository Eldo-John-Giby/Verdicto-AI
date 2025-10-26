import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    queryText: v.string(),
    uploadedFiles: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const queryId = await ctx.db.insert("queries", {
      userId,
      queryText: args.queryText,
      uploadedFiles: args.uploadedFiles,
      status: "pending",
    });

    return queryId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const queries = await ctx.db
      .query("queries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    return queries;
  },
});

export const updateStatus = internalMutation({
  args: {
    queryId: v.id("queries"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const query = await ctx.db.get(args.queryId);
    if (!query) {
      throw new Error("Query not found");
    }

    await ctx.db.patch(args.queryId, { status: args.status });
  },
});