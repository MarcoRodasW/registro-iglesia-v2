import { v } from "convex/values";
import {
	authedQuery,
	adminQuery,
	adminMutation,
	adminOrLeaderQuery,
} from "./utils";

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

export const listLeaders = adminOrLeaderQuery({
	args: {},
	handler: async (ctx) => {
		const users = await ctx.db.query("users").collect();
		return users
			.filter((u) => u.role === "admin" || u.role === "leader")
			.map((u) => ({
				_id: u._id,
				name: u.name,
				email: u.email,
			}));
	},
});

export const setUserRole = adminMutation({
	args: {
		userId: v.id("users"),
		role: v.union(v.literal("admin"), v.literal("leader"), v.literal("user")),
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
