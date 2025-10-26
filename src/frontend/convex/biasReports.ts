import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getByPrediction = query({
  args: {
    predictionId: v.id("predictions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const report = await ctx.db
      .query("biasReports")
      .withIndex("by_prediction", (q) => q.eq("predictionId", args.predictionId))
      .first();

    if (!report || report.userId !== userId) return null;

    return report;
  },
});
