import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

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
