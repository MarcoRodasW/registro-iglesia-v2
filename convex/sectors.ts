import { v } from "convex/values";
import { adminOrLeaderQuery, adminOrLeaderMutation } from "./utils";

export const listSectors = adminOrLeaderQuery({
	args: {},
	handler: async (ctx) => {
		const sectors = await ctx.db.query("sectors").collect();

		const sectorsWithCounts = await Promise.all(
			sectors.map(async (sector) => {
				const members = await ctx.db
					.query("members")
					.withIndex("by_sector", (q) => q.eq("sectorId", sector._id))
					.collect();
				const memberCount = members.length;
				const leaderCount = sector.leaderIds?.length ?? 0;

				return {
					...sector,
					memberCount,
					leaderCount,
				};
			}),
		);

		return sectorsWithCounts;
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

		const members = await ctx.db
			.query("members")
			.withIndex("by_sector", (q) => q.eq("sectorId", args.sectorId))
			.collect();
		const memberCount = members.length;

		const leaderCount = sector.leaderIds?.length ?? 0;

		return {
			...sector,
			memberCount,
			leaderCount,
		};
	},
});

export const listLeadersBySector = adminOrLeaderQuery({
	args: {
		sectorId: v.id("sectors"),
	},
	handler: async (ctx, args) => {
		const sector = await ctx.db.get(args.sectorId);
		if (!sector?.leaderIds || sector.leaderIds.length === 0) {
			return [];
		}

		const leaders = await Promise.all(
			sector.leaderIds.map(async (leaderId) => {
				const user = await ctx.db.get(leaderId);
				if (!user) {
					return null;
				}

				return {
					_id: user._id,
					name: user.name,
					email: user.email,
				};
			}),
		);

		return leaders.filter((leader) => leader !== null);
	},
});

export const createSector = adminOrLeaderMutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		leaderIds: v.optional(v.array(v.id("users"))),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("sectors", args);
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
		await ctx.db.delete(args.sectorId);
		return args.sectorId;
	},
});
