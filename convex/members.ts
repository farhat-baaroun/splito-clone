import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const listByGroup = query({
  args: { groupId: v.id('groups') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('members')
      .withIndex('by_group', (q) => q.eq('groupId', args.groupId))
      .collect()
  },
})

export const add = mutation({
  args: { groupId: v.id('groups'), name: v.string() },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId)
    if (!group) throw new Error('Group not found')
    return await ctx.db.insert('members', {
      groupId: args.groupId,
      name: args.name.trim(),
    })
  },
})

export const remove = mutation({
  args: { id: v.id('members') },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.id)
    if (!member) throw new Error('Member not found')
    await ctx.db.delete(args.id)
    return args.id
  },
})

export const rename = mutation({
  args: { id: v.id('members'), name: v.string() },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.id)
    if (!member) throw new Error('Member not found')
    await ctx.db.patch(args.id, { name: args.name.trim() })
    return args.id
  },
})

export const updateImage = mutation({
  args: {
    id: v.id('members'),
    imageStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.id)
    if (!member) throw new Error('Member not found')
    await ctx.db.patch(args.id, { imageStorageId: args.imageStorageId })
    return args.id
  },
})
