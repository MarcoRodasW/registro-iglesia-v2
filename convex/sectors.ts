import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import {
	countLeadersInSector,
	membersBySector,
	roleBounds,
	usersBySectorAndRole,
} from "./aggregates";
import { adminOrLeaderMutation, adminOrLeaderQuery } from "./utils";

function isLeaderRole(user: Doc<"users">) {
	return user.role === "admin" || user.role === "leader";
}

function mapLeader(user: Doc<"users">) {
	return {
		_id: user._id,
		name: user.name,
		email: user.email,
	};
}

export const listSectors = adminOrLeaderQuery({
	args: {},
	handler: async (ctx) => {
		const sectors = await ctx.db.query("sectors").collect();
		const memberCounts = await membersBySector.countBatch(
			ctx,
			sectors.map((sector) => ({ namespace: sector._id })),
		);
		const leaderAndAdminCounts = await usersBySectorAndRole.countBatch(
			ctx,
			sectors.flatMap((sector) => [
				{ namespace: sector._id, bounds: roleBounds("leader") },
				{ namespace: sector._id, bounds: roleBounds("admin") },
			]),
		);

		const withCounts = sectors.map((sector, index) => ({
			...sector,
			memberCount: memberCounts[index] ?? 0,
			leaderCount:
				(leaderAndAdminCounts[index * 2] ?? 0) +
				(leaderAndAdminCounts[index * 2 + 1] ?? 0),
		}));

		return withCounts;
	},
});

export const getSector = adminOrLeaderQuery({
	args: {
		sectorId: v.id("sectors"),
	},
		handler: async (ctx, args) => {
			const sector = await ctx.db.get(args.sectorId);
			if (!sector) {
				return null;
			}

		const [members, leaders] = await Promise.all([
			ctx.db
				.query("members")
				.withIndex("by_sector", (q) => q.eq("sectorId", args.sectorId))
				.collect(),
			ctx.db
				.query("users")
				.withIndex("by_sector", (q) => q.eq("sectorId", args.sectorId))
				.collect(),
		]);

			const mappedLeaders = leaders.filter(isLeaderRole).map(mapLeader);
			const mappedMembers = members.map((member) => ({
				_id: member._id,
				fullName: member.fullName,
				phone: member.phone,
				address: member.address,
			}));
			const [memberCount, leaderCount] = await Promise.all([
				membersBySector.count(ctx, { namespace: args.sectorId }),
				countLeadersInSector(ctx, args.sectorId),
			]);

			return {
				...sector,
				memberCount,
				leaderCount,
				members: mappedMembers,
				leaders: mappedLeaders,
			};
		},
});

export const createSector = adminOrLeaderMutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		leaderIds: v.optional(v.array(v.id("users"))),
	},
		handler: async (ctx, args) => {
			const sectorId = await ctx.db.insert("sectors", {
				name: args.name,
				description: args.description,
				leaderIds: undefined,
			});

			if (args.leaderIds && args.leaderIds.length > 0) {
				const leaders = await Promise.all(
					args.leaderIds.map((leaderId) => ctx.db.get(leaderId)),
				);

				await Promise.all(
					leaders
						.filter((leader): leader is Doc<"users"> => leader !== null)
						.map(async (leader) => {
							await ctx.db.patch(leader._id, { sectorId });
							const updated = await ctx.db.get(leader._id);
							if (updated) {
								await usersBySectorAndRole.replaceOrInsert(ctx, leader, updated);
							}
						}),
				);
			}

		return sectorId;
	},
});

export const updateSector = adminOrLeaderMutation({
	args: {
		sectorId: v.id("sectors"),
		name: v.string(),
		description: v.optional(v.string()),
	},
		handler: async (ctx, args) => {
		const sector = await ctx.db.get(args.sectorId);
		if (!sector) {
			throw new Error("Sector not found");
		}

		await ctx.db.patch(args.sectorId, {
			name: args.name,
			description: args.description,
		});

		return args.sectorId;
	},
});

export const deleteSector = adminOrLeaderMutation({
	args: {
		sectorId: v.id("sectors"),
	},
	handler: async (ctx, args) => {
		const sector = await ctx.db.get(args.sectorId);
		if (!sector) {
			throw new Error("Sector not found");
		}

		const leaders = await ctx.db
			.query("users")
			.withIndex("by_sector", (q) => q.eq("sectorId", args.sectorId))
			.collect();

		await Promise.all([
			...leaders.map(async (leader) => {
				await ctx.db.patch(leader._id, { sectorId: undefined });
				const updated = await ctx.db.get(leader._id);
				if (updated) {
					await usersBySectorAndRole.replaceOrInsert(ctx, leader, updated);
				}
			}),
			ctx.db.delete(args.sectorId),
		]);

		return args.sectorId;
	},
});

export const setSectorLeaders = adminOrLeaderMutation({
	args: {
		sectorId: v.id("sectors"),
		leaderIds: v.array(v.id("users")),
	},
	handler: async (ctx, args) => {
		const sector = await ctx.db.get(args.sectorId);
		if (!sector) {
			throw new Error("Sector not found");
		}

		const [currentSectorLeaders, targetLeaders] = await Promise.all([
			ctx.db
				.query("users")
				.withIndex("by_sector", (q) => q.eq("sectorId", args.sectorId))
				.collect(),
			Promise.all(args.leaderIds.map((leaderId) => ctx.db.get(leaderId))),
		]);

		const validTargetLeaders = targetLeaders.filter(
			(leader): leader is Doc<"users"> => leader !== null && isLeaderRole(leader),
		);

		for (const leader of validTargetLeaders) {
			if (leader.sectorId && leader.sectorId !== args.sectorId) {
				throw new Error("One or more leaders are already assigned to another sector");
			}
		}

		const targetLeaderIds = new Set<string>(validTargetLeaders.map((l) => l._id));

		const removeOps = currentSectorLeaders
			.filter((leader) => !targetLeaderIds.has(leader._id))
			.map(async (leader) => {
				await ctx.db.patch(leader._id, { sectorId: undefined });
				const updated = await ctx.db.get(leader._id);
				if (updated) {
					await usersBySectorAndRole.replaceOrInsert(ctx, leader, updated);
				}
			});

		const assignOps = validTargetLeaders.map(async (leader) => {
			await ctx.db.patch(leader._id, { sectorId: args.sectorId });
			const updated = await ctx.db.get(leader._id);
			if (updated) {
				await usersBySectorAndRole.replaceOrInsert(ctx, leader, updated);
			}
		});

		await Promise.all([...removeOps, ...assignOps]);

		return args.sectorId;
	},
});

export const assignMembersToSector = adminOrLeaderMutation({
	args: {
		sectorId: v.id("sectors"),
		memberIds: v.array(v.id("members")),
	},
		handler: async (ctx, args) => {
		const sector = await ctx.db.get(args.sectorId);
		if (!sector) {
			throw new Error("Sector not found");
		}

		const members = await Promise.all(
			args.memberIds.map((memberId) => ctx.db.get(memberId)),
		);

		for (const member of members) {
			if (member && member.sectorId && member.sectorId !== args.sectorId) {
				throw new Error("One or more members already belong to another sector");
			}
		}

		await Promise.all(
			members
				.filter((member): member is Doc<"members"> => member !== null)
				.map(async (member) => {
					await ctx.db.patch(member._id, { sectorId: args.sectorId });
					const updated = await ctx.db.get(member._id);
					if (updated) {
						await membersBySector.replaceOrInsert(ctx, member, updated);
					}
				}),
		);

		return args.sectorId;
	},
});

export const removeMembersFromSector = adminOrLeaderMutation({
	args: {
		memberIds: v.array(v.id("members")),
	},
		handler: async (ctx, args) => {
		const members = await Promise.all(
			args.memberIds.map((memberId) => ctx.db.get(memberId)),
		);

		await Promise.all(
			members
				.filter((member): member is Doc<"members"> => member !== null)
				.map(async (member) => {
					await ctx.db.patch(member._id, { sectorId: undefined });
					const updated = await ctx.db.get(member._id);
					if (updated) {
						await membersBySector.replaceOrInsert(ctx, member, updated);
					}
				}),
		);

		return args.memberIds;
	},
});

export const searchMembersNotInSector = adminOrLeaderQuery({
	args: {
		search: v.optional(v.string()),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { search, limit = 20 } = args;

		let members = await ctx.db
			.query("members")
			.withIndex("by_sector", (q) => q.eq("sectorId", undefined))
			.order("desc")
			.collect();

		if (search && search.trim() !== "") {
			const lower = search.toLowerCase();
			members = members.filter((member) =>
				member.fullName.toLowerCase().includes(lower),
			);
		}

		return members.slice(0, limit).map((member) => ({
			id: member._id,
			fullName: member.fullName,
		}));
	},
});
