import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import {
  computeBalances,
  balancesToEntries,
  greedyMinCashFlow,
} from './lib/settlement'

const sandboxStatus = v.union(
  v.literal('active'),
  v.literal('settled'),
  v.literal('archived')
)

export const create = mutation({
  args: {
    groupId: v.id('groups'),
    name: v.string(),
    currency: v.optional(v.string()),
    memberIds: v.optional(v.array(v.id('members'))),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId)
    if (!group) throw new Error('Group not found')
    const members = await ctx.db
      .query('members')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .collect()
    const memberIds = args.memberIds ?? members.map((m) => m._id)
    if (memberIds.length === 0) throw new Error('At least one member required')
    return await ctx.db.insert('sandboxes', {
      groupId: args.groupId,
      name: args.name.trim(),
      status: 'active',
      currency: args.currency ?? 'USD',
      memberIds,
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

    const result = await Promise.all(
      sandboxes.map(async (sandbox) => {
        const memberCount = sandbox.memberIds
          ? sandbox.memberIds.length
          : members.length
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
      const payments = await ctx.db
        .query('payments')
        .withIndex('by_sandbox', (q) => q.eq('sandboxId', args.id))
        .collect()
      const allMembers = await ctx.db
        .query('members')
        .withIndex('by_group', (q) => q.eq('groupId', sandbox.groupId))
        .collect()
      const memberIds = sandbox.memberIds ?? allMembers.map((m) => m._id)
      const members = allMembers.filter((m) => memberIds.includes(m._id))
      const nameMap = new Map(members.map((m) => [m._id, m.name]))
      const paymentInputs = payments.map((p) => ({
        amount: p.amount,
        paidBy: p.paidBy,
        paidFor: p.paidFor,
      }))
      const balances = computeBalances(paymentInputs, memberIds)
      const balanceEntries = balancesToEntries(balances, nameMap)
      const suggestions = greedyMinCashFlow(balances, nameMap)
      const totalExpense = payments.reduce((sum, p) => sum + p.amount, 0)
      await ctx.db.insert('settlementSnapshots', {
        sandboxId: args.id,
        balances: balanceEntries,
        suggestions,
        totalExpense,
        triggeredBy: 'settled',
      })
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

export const updateImage = mutation({
  args: {
    id: v.id('sandboxes'),
    imageStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: authentication required')
    }
    const sandbox = await ctx.db.get(args.id)
    if (!sandbox) throw new Error('Sandbox not found')
    await ctx.db.patch(args.id, { imageStorageId: args.imageStorageId })
    return args.id
  },
})

export const updateCurrency = mutation({
  args: {
    id: v.id('sandboxes'),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const sandbox = await ctx.db.get(args.id)
    if (!sandbox) throw new Error('Sandbox not found')
    await ctx.db.patch(args.id, { currency: args.currency })
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
