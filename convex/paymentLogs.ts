import { query } from './_generated/server'
import { v } from 'convex/values'

export const listBySandbox = query({
  args: { sandboxId: v.id('sandboxes') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('paymentLogs')
      .withIndex('by_sandbox', (q) => q.eq('sandboxId', args.sandboxId))
      .order('desc')
      .collect()
  },
})
