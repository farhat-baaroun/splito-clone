import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

function markKey(from: string, to: string, amount: number) {
  return `${from}|${to}|${amount.toFixed(2)}`
}

export const listBySandbox = query({
  args: { sandboxId: v.id('sandboxes') },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query('settleUpMarks')
      .withIndex('by_sandbox', (q) => q.eq('sandboxId', args.sandboxId))
      .collect()
    return marks.map((m) => markKey(m.fromMemberId, m.toMemberId, m.amount))
  },
})

export const toggle = mutation({
  args: {
    sandboxId: v.id('sandboxes'),
    fromMemberId: v.string(),
    toMemberId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const key = markKey(args.fromMemberId, args.toMemberId, args.amount)
    const existing = await ctx.db
      .query('settleUpMarks')
      .withIndex('by_sandbox', (q) => q.eq('sandboxId', args.sandboxId))
      .collect()
    const match = existing.find(
      (m) =>
        m.fromMemberId === args.fromMemberId &&
        m.toMemberId === args.toMemberId &&
        Math.abs(m.amount - args.amount) < 0.01
    )
    if (match) {
      await ctx.db.delete(match._id)
      return false
    }
    await ctx.db.insert('settleUpMarks', {
      sandboxId: args.sandboxId,
      fromMemberId: args.fromMemberId,
      toMemberId: args.toMemberId,
      amount: args.amount,
    })
    return true
  },
})
