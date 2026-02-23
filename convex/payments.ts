import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'

function isEditable(status: string) {
  return status === 'active'
}

export const listBySandbox = query({
  args: { sandboxId: v.id('sandboxes') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('payments')
      .withIndex('by_sandbox', (q) => q.eq('sandboxId', args.sandboxId))
      .order('desc')
      .collect()
  },
})

export const create = mutation({
  args: {
    sandboxId: v.id('sandboxes'),
    groupId: v.id('groups'),
    title: v.string(),
    amount: v.number(),
    paidBy: v.id('members'),
    paidFor: v.array(v.id('members')),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const sandbox = await ctx.db.get(args.sandboxId)
    if (!sandbox) throw new Error('Sandbox not found')
    if (!isEditable(sandbox.status)) {
      throw new Error('Cannot add payments to a settled or archived sandbox')
    }
    if (args.amount <= 0) throw new Error('Amount must be positive')
    if (args.paidFor.length === 0) throw new Error('At least one beneficiary required')

    const now = Date.now()
    const paymentId = await ctx.db.insert('payments', {
      sandboxId: args.sandboxId,
      groupId: args.groupId,
      title: args.title.trim(),
      amount: args.amount,
      paidBy: args.paidBy,
      paidFor: args.paidFor,
      updatedAt: now,
    })

    await ctx.db.insert('paymentLogs', {
      sandboxId: args.sandboxId,
      paymentId,
      action: 'create',
      newValue: {
        title: args.title,
        amount: args.amount,
        paidBy: args.paidBy,
        paidFor: args.paidFor,
      },
      timestamp: now,
    })

    return paymentId
  },
})

export const update = mutation({
  args: {
    id: v.id('payments'),
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    paidBy: v.optional(v.id('members')),
    paidFor: v.optional(v.array(v.id('members'))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.id)
    if (!payment) throw new Error('Payment not found')

    const sandbox = await ctx.db.get(payment.sandboxId)
    if (!sandbox || !isEditable(sandbox.status)) {
      throw new Error('Cannot edit payments in a settled or archived sandbox')
    }

    const previousValue = {
      title: payment.title,
      amount: payment.amount,
      paidBy: payment.paidBy,
      paidFor: payment.paidFor,
      tags: payment.tags,
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    }
    if (args.title !== undefined) updates.title = args.title.trim()
    if (args.amount !== undefined) {
      if (args.amount <= 0) throw new Error('Amount must be positive')
      updates.amount = args.amount
    }
    if (args.paidBy !== undefined) updates.paidBy = args.paidBy
    if (args.paidFor !== undefined) {
      if (args.paidFor.length === 0) throw new Error('At least one beneficiary required')
      updates.paidFor = args.paidFor
    }
    if (args.tags !== undefined) updates.tags = args.tags

    await ctx.db.patch(args.id, updates)
    const updated = await ctx.db.get(args.id)

    await ctx.db.insert('paymentLogs', {
      sandboxId: payment.sandboxId,
      paymentId: args.id,
      action: 'update',
      previousValue,
      newValue: updated
        ? {
            title: updated.title,
            amount: updated.amount,
            paidBy: updated.paidBy,
            paidFor: updated.paidFor,
          }
        : undefined,
      timestamp: Date.now(),
    })

    return args.id
  },
})

export const remove = mutation({
  args: { id: v.id('payments') },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.id)
    if (!payment) throw new Error('Payment not found')

    const sandbox = await ctx.db.get(payment.sandboxId)
    if (!sandbox || !isEditable(sandbox.status)) {
      throw new Error('Cannot delete payments in a settled or archived sandbox')
    }

    const previousValue = {
      title: payment.title,
      amount: payment.amount,
      paidBy: payment.paidBy,
      paidFor: payment.paidFor,
      tags: payment.tags,
    }

    await ctx.db.insert('paymentLogs', {
      sandboxId: payment.sandboxId,
      paymentId: args.id,
      action: 'delete',
      previousValue,
      timestamp: Date.now(),
    })

    await ctx.db.delete(args.id)
    return args.id
  },
})

export const revertFromLog = mutation({
  args: { logId: v.id('paymentLogs') },
  handler: async (ctx, args) => {
    const log = await ctx.db.get(args.logId)
    if (!log) throw new Error('Log not found')
    if (log.action === 'create') {
      throw new Error('Cannot undo a create action')
    }
    const sandbox = await ctx.db.get(log.sandboxId)
    if (!sandbox || sandbox.status !== 'active') {
      throw new Error('Cannot revert in a settled or archived sandbox')
    }
    const prev = log.previousValue as
      | { title: string; amount: number; paidBy: Id<'members'>; paidFor: Id<'members'>[]; tags?: string[] }
      | undefined
    if (!prev) throw new Error('No previous value to revert to')
    const now = Date.now()
    if (log.action === 'delete') {
      const paymentId = await ctx.db.insert('payments', {
        sandboxId: log.sandboxId,
        groupId: sandbox.groupId,
        title: prev.title,
        amount: prev.amount,
        paidBy: prev.paidBy as Id<'members'>,
        paidFor: prev.paidFor as Id<'members'>[],
        tags: prev.tags,
        updatedAt: now,
      })
      await ctx.db.insert('paymentLogs', {
        sandboxId: log.sandboxId,
        paymentId,
        action: 'create',
        newValue: prev,
        timestamp: now,
      })
      return paymentId
    }
    if (log.action === 'update' && log.paymentId) {
      const payment = await ctx.db.get(log.paymentId)
      if (!payment) throw new Error('Payment no longer exists')
      await ctx.db.patch(log.paymentId, {
        title: prev.title,
        amount: prev.amount,
        paidBy: prev.paidBy as Id<'members'>,
        paidFor: prev.paidFor as Id<'members'>[],
        tags: prev.tags,
        updatedAt: now,
      })
      await ctx.db.insert('paymentLogs', {
        sandboxId: log.sandboxId,
        paymentId: log.paymentId,
        action: 'update',
        previousValue: log.newValue,
        newValue: prev,
        timestamp: now,
      })
      return log.paymentId
    }
    throw new Error('Cannot revert this log entry')
  },
})
