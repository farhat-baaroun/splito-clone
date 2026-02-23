import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert('groups', {
      name: args.name.trim(),
    })
  },
})

export const get = query({
  args: { id: v.id('groups') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('groups')
      .order('desc')
      .collect()
  },
})

export const updateImage = mutation({
  args: {
    id: v.id('groups'),
    imageStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: authentication required')
    }
    const group = await ctx.db.get(args.id)
    if (!group) throw new Error('Group not found')
    await ctx.db.patch(args.id, { imageStorageId: args.imageStorageId })
    return args.id
  },
})
