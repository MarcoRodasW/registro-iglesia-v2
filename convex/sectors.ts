import { v } from "convex/values";
import { adminOrLeaderQuery, adminOrLeaderMutation } from "./utils";

export const listSectors = adminOrLeaderQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("sectors").collect();
	},
});

export const createSector = adminOrLeaderMutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
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
