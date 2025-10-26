import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    title: v.string(),
    transcript: v.string(),
    bulletPoints: v.array(v.string()),
    aiSummary: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const noteId = await ctx.db.insert("verdictNotes", {
      userId,
      title: args.title,
      transcript: args.transcript,
      bulletPoints: args.bulletPoints,
      aiSummary: args.aiSummary,
      timestamp: Date.now(),
    });

    return noteId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const notes = await ctx.db
      .query("verdictNotes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    return notes;
  },
});

export const get = query({
  args: { noteId: v.id("verdictNotes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or unauthorized");
    }

    return note;
  },
});

export const deleteNote = mutation({
  args: { noteId: v.id("verdictNotes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or unauthorized");
    }

    await ctx.db.delete(args.noteId);
  },
});
