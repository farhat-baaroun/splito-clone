import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

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
