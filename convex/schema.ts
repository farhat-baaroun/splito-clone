import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const sandboxStatus = v.union(
  v.literal('active'),
  v.literal('settled'),
  v.literal('archived')
)

export default defineSchema({
  groups: defineTable({
    name: v.string(),
  }),

  members: defineTable({
    groupId: v.id('groups'),
    name: v.string(),
  }).index('by_group', ['groupId']),

  sandboxes: defineTable({
    groupId: v.id('groups'),
    name: v.string(),
    status: sandboxStatus,
    settledAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
  })
    .index('by_group', ['groupId'])
    .index('by_group_status', ['groupId', 'status']),

  payments: defineTable({
    sandboxId: v.id('sandboxes'),
    groupId: v.id('groups'),
    title: v.string(),
    amount: v.number(),
    paidBy: v.id('members'),
    paidFor: v.array(v.id('members')),
    updatedAt: v.number(),
  })
    .index('by_sandbox', ['sandboxId'])
    .index('by_group', ['groupId']),

  paymentLogs: defineTable({
    sandboxId: v.id('sandboxes'),
    paymentId: v.id('payments'),
    action: v.union(
      v.literal('create'),
      v.literal('update'),
      v.literal('delete')
    ),
    previousValue: v.optional(v.any()),
    newValue: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index('by_sandbox', ['sandboxId'])
    .index('by_payment', ['paymentId']),
})
