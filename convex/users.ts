import { v } from "convex/values";
import { authedQuery, adminQuery, adminMutation } from "./utils";

export const getCurrentUserWithRole = authedQuery({
	args: {},
	handler: async (ctx) => {
		const appUser = await ctx.db
			.query("users")
			.withIndex("by_authId", (q) => q.eq("authId", ctx.user._id))
			.unique();
		return {
			...ctx.user,
			role: appUser?.role ?? "user",
			appUserId: appUser?._id ?? null,
		};
	},
});

export const listUsers = adminQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("users").order("desc").collect();
	},
});

export const setUserRole = adminMutation({
	args: {
		userId: v.id("users"),
		role: v.union(v.literal("admin"), v.literal("user")),
	},
	handler: async (ctx, args) => {
		const targetUser = await ctx.db.get(args.userId);
		if (!targetUser) {
			throw new Error("User not found");
		}
		if (targetUser._id === ctx.appUser._id && args.role !== "admin") {
			throw new Error("Cannot remove your own admin role");
		}
		await ctx.db.patch(args.userId, { role: args.role });
		return args.userId;
	},
});
