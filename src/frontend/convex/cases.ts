import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (args.category) {
      const category = args.category;
      const cases = await ctx.db
        .query("cases")
        .withIndex("by_category", (q) => q.eq("category", category))
        .order("desc")
        .take(args.limit || 50);
      return cases;
    }

    const cases = await ctx.db
      .query("cases")
      .order("desc")
      .take(args.limit || 50);

    return cases;
  },
});

export const search = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const allCases = await ctx.db.query("cases").collect();
    
    const searchLower = args.searchTerm.toLowerCase();
    return allCases.filter(
      (c) =>
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower) ||
        c.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  },
});

export const seedCases = mutation({
  args: {},
  handler: async (ctx) => {
    const sampleCases = [
      {
        caseNumber: "CR-2023-001",
        title: "State v. Johnson - AI Evidence Admissibility",
        description: "Landmark case establishing standards for AI-generated evidence in criminal proceedings",
        outcome: "Ruled in favor of defendant - AI evidence deemed inadmissible without proper validation",
        jurisdiction: "Federal",
        year: 2023,
        category: "Criminal Law",
        tags: ["AI Evidence", "Technology", "Criminal Procedure"],
      },
      {
        caseNumber: "CV-2022-445",
        title: "Tech Corp v. Privacy Alliance",
        description: "Data privacy case involving algorithmic bias in hiring practices",
        outcome: "Settlement reached - Company agreed to audit and reform AI hiring systems",
        jurisdiction: "State",
        year: 2022,
        category: "Employment Law",
        tags: ["Privacy", "Discrimination", "AI Bias"],
      },
      {
        caseNumber: "CR-2023-089",
        title: "People v. Martinez - Predictive Policing Challenge",
        description: "Constitutional challenge to predictive policing algorithms",
        outcome: "Partially upheld - Required transparency in algorithmic decision-making",
        jurisdiction: "Federal",
        year: 2023,
        category: "Criminal Law",
        tags: ["Policing", "AI", "Constitutional Rights"],
      },
    ];

    for (const caseData of sampleCases) {
      await ctx.db.insert("cases", caseData);
    }

    return { success: true, count: sampleCases.length };
  },
});
