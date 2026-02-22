import { query } from './_generated/server'
import { v } from 'convex/values'
import {
  computeBalances,
  balancesToEntries,
  computeExpensesPerMember,
  greedyMinCashFlow,
} from './lib/settlement'

export const getSettlement = query({
  args: { sandboxId: v.id('sandboxes') },
  handler: async (ctx, args) => {
    const sandbox = await ctx.db.get(args.sandboxId)
    if (!sandbox) return null

    const payments = await ctx.db
      .query('payments')
      .withIndex('by_sandbox', (q) => q.eq('sandboxId', args.sandboxId))
      .collect()

    const members = await ctx.db
      .query('members')
      .withIndex('by_group', (q) => q.eq('groupId', sandbox.groupId))
      .collect()

    const memberIds = members.map((m) => m._id)
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
    const expensesPerMember = computeExpensesPerMember(
      paymentInputs,
      memberIds,
      nameMap
    )

    return {
      balances: balanceEntries,
      suggestions,
      totalExpense,
      expensesPerMember,
    }
  },
})
