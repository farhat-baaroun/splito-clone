import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const create = mutation({
  args: {
    sandboxId: v.id('sandboxes'),
    balances: v.any(),
    suggestions: v.any(),
    totalExpense: v.number(),
    triggeredBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('settlementSnapshots', {
      sandboxId: args.sandboxId,
      balances: args.balances,
      suggestions: args.suggestions,
      totalExpense: args.totalExpense,
      triggeredBy: args.triggeredBy,
    })
  },
})

export const listBySandbox = query({
  args: { sandboxId: v.id('sandboxes') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('settlementSnapshots')
      .withIndex('by_sandbox', (q) => q.eq('sandboxId', args.sandboxId))
      .order('desc')
      .collect()
  },
})
