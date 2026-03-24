import { v } from "convex/values";
import { usersBySectorAndRole } from "./aggregates";
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

export const listAssignableLeaders = adminOrLeaderQuery({
	args: {
		sectorId: v.optional(v.id("sectors")),
		search: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const [unassignedUsers, currentSectorUsers] = await Promise.all([
			ctx.db
				.query("users")
				.withIndex("by_sector", (q) => q.eq("sectorId", undefined))
				.collect(),
			args.sectorId
				? ctx.db
						.query("users")
						.withIndex("by_sector", (q) => q.eq("sectorId", args.sectorId))
						.collect()
				: Promise.resolve([]),
		]);

		const merged = [...unassignedUsers, ...currentSectorUsers];
		const dedupedById = new Map(merged.map((user) => [user._id, user]));

		let leaders = [...dedupedById.values()].filter(
			(u) => u.role === "admin" || u.role === "leader",
		);

		if (args.search && args.search.trim() !== "") {
			const lower = args.search.toLowerCase();
			leaders = leaders.filter((u) => u.name.toLowerCase().includes(lower));
		}

		return leaders.map((u) => ({
			_id: u._id,
			name: u.name,
			email: u.email,
			sectorId: u.sectorId,
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
		await ctx.db.patch(args.userId, {
			role: args.role,
			sectorId: args.role === "user" ? undefined : targetUser.sectorId,
		});

		const updatedUser = await ctx.db.get(args.userId);
		if (!updatedUser) {
			throw new Error("User not found");
		}

		await usersBySectorAndRole.replaceOrInsert(ctx, targetUser, updatedUser);
		return args.userId;
	},
});
