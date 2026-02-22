import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const sandboxStatus = v.union(
  v.literal('active'),
  v.literal('settled'),
  v.literal('archived')
)

export const create = mutation({
  args: { groupId: v.id('groups'), name: v.string() },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId)
    if (!group) throw new Error('Group not found')
    return await ctx.db.insert('sandboxes', {
      groupId: args.groupId,
      name: args.name.trim(),
      status: 'active',
    })
  },
})

export const listByGroup = query({
  args: { groupId: v.id('groups') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sandboxes')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .order('desc')
      .collect()
  },
})

export const listByGroupWithSummary = query({
  args: { groupId: v.id('groups') },
  handler: async (ctx, args) => {
    const sandboxes = await ctx.db
      .query('sandboxes')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .order('desc')
      .collect()

    const members = await ctx.db
      .query('members')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .collect()
    const memberCount = members.length

    const result = await Promise.all(
      sandboxes.map(async (sandbox) => {
        const payments = await ctx.db
          .query('payments')
          .withIndex('by_sandbox', (q) => q.eq('sandboxId', sandbox._id))
          .collect()
        const totalExpense = payments.reduce((sum, p) => sum + p.amount, 0)
        const lastActivity =
          payments.length > 0
            ? Math.max(...payments.map((p) => p.updatedAt))
            : sandbox._creationTime
        return {
          ...sandbox,
          totalExpense,
          memberCount,
          lastActivity,
        }
      })
    )
    return result
  },
})

export const get = query({
  args: { id: v.id('sandboxes') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const rename = mutation({
  args: { id: v.id('sandboxes'), name: v.string() },
  handler: async (ctx, args) => {
    const sandbox = await ctx.db.get(args.id)
    if (!sandbox) throw new Error('Sandbox not found')
    await ctx.db.patch(args.id, { name: args.name.trim() })
    return args.id
  },
})

export const setStatus = mutation({
  args: {
    id: v.id('sandboxes'),
    status: sandboxStatus,
  },
  handler: async (ctx, args) => {
    const sandbox = await ctx.db.get(args.id)
    if (!sandbox) throw new Error('Sandbox not found')
    const now = Date.now()
    const updates: Record<string, unknown> = { status: args.status }
    if (args.status === 'settled') {
      updates.settledAt = now
      updates.archivedAt = undefined
    } else if (args.status === 'archived') {
      updates.archivedAt = now
    } else if (args.status === 'active') {
      updates.settledAt = undefined
      updates.archivedAt = undefined
    }
    await ctx.db.patch(args.id, updates)
    return args.id
  },
})

export const reopen = mutation({
  args: { id: v.id('sandboxes') },
  handler: async (ctx, args) => {
    const sandbox = await ctx.db.get(args.id)
    if (!sandbox) throw new Error('Sandbox not found')
    if (sandbox.status !== 'settled') {
      throw new Error('Only settled sandboxes can be reopened')
    }
    await ctx.db.patch(args.id, {
      status: 'active',
      settledAt: undefined,
    })
    return args.id
  },
})
