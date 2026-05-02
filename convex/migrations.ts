import { v } from "convex/values";
import {
	membersByCreationTime,
	membersBySector,
	roleBounds,
	usersBySectorAndRole,
} from "./aggregates";
import { internalMutation } from "./_generated/server";

export const backfillMembersAggregates = internalMutation({
	args: {},
	handler: async (ctx) => {
		const members = await ctx.db.query("members").collect();

		for (const member of members) {
			await Promise.all([
				membersByCreationTime.insertIfDoesNotExist(ctx, member),
				membersBySector.insertIfDoesNotExist(ctx, member),
			]);
		}

		return {
			processed: members.length,
		};
	},
});

export const backfillUsersAggregates = internalMutation({
	args: {},
	handler: async (ctx) => {
		const users = await ctx.db.query("users").collect();

		for (const user of users) {
			await usersBySectorAndRole.insertIfDoesNotExist(ctx, user);
		}

		return {
			processed: users.length,
		};
	},
});

export const backfillInvitedByName = internalMutation({
	args: {},
	handler: async (ctx) => {
		const members = await ctx.db.query("members").collect();

		let updated = 0;
		let skippedNoInvitedBy = 0;
		let skippedAlreadyHasName = 0;
		let skippedInviterMissing = 0;

		for (const member of members) {
			if (!member.invitedBy) {
				skippedNoInvitedBy += 1;
				continue;
			}

			if (member.invitedByName?.trim()) {
				skippedAlreadyHasName += 1;
				continue;
			}

			const inviter = await ctx.db.get(member.invitedBy);
			if (!inviter?.fullName?.trim()) {
				skippedInviterMissing += 1;
				continue;
			}

			await ctx.db.patch(member._id, {
				invitedByName: inviter.fullName,
			});
			updated += 1;
		}

		return {
			processed: members.length,
			updated,
			skippedNoInvitedBy,
			skippedAlreadyHasName,
			skippedInviterMissing,
		};
	},
});

export const migrateSectorLeaderIdsToUserSector = internalMutation({
	args: {},
	handler: async (ctx) => {
		const sectors = await ctx.db.query("sectors").collect();

		let attempted = 0;
		let updated = 0;

		for (const sector of sectors) {
			for (const leaderId of sector.leaderIds ?? []) {
				attempted += 1;
				const leader = await ctx.db.get(leaderId);
				if (!leader) {
					continue;
				}

				if (leader.sectorId === sector._id) {
					continue;
				}

				await ctx.db.patch(leaderId, { sectorId: sector._id });
				updated += 1;

				const newDoc = await ctx.db.get(leaderId);
				if (newDoc) {
					await usersBySectorAndRole.replaceOrInsert(ctx, leader, newDoc);
				}
			}
		}

		return {
			processed: sectors.length,
			attempted,
			updated,
		};
	},
});

export const reconcileUsersAggregateForSector = internalMutation({
	args: {
		sectorId: v.id("sectors"),
	},
	handler: async (ctx, args) => {
		const users = await ctx.db
			.query("users")
			.withIndex("by_sector", (q) => q.eq("sectorId", args.sectorId))
			.collect();

		for (const user of users) {
			await usersBySectorAndRole.insertIfDoesNotExist(ctx, user);
		}

		return {
			processed: users.length,
		};
	},
});

export const reconcileMembersAggregateForSector = internalMutation({
	args: {
		sectorId: v.id("sectors"),
	},
	handler: async (ctx, args) => {
		const members = await ctx.db
			.query("members")
			.withIndex("by_sector", (q) => q.eq("sectorId", args.sectorId))
			.collect();

		for (const member of members) {
			await membersBySector.insertIfDoesNotExist(ctx, member);
		}

		return {
			processed: members.length,
		};
	},
});

export const rebuildAllAggregates = internalMutation({
	args: {},
	handler: async (ctx) => {
		await Promise.all([
			membersByCreationTime.clearAll(ctx),
			membersBySector.clearAll(ctx),
			usersBySectorAndRole.clearAll(ctx),
		]);

		const [members, users] = await Promise.all([
			ctx.db.query("members").collect(),
			ctx.db.query("users").collect(),
		]);

		for (const member of members) {
			await Promise.all([
				membersByCreationTime.insertIfDoesNotExist(ctx, member),
				membersBySector.insertIfDoesNotExist(ctx, member),
			]);
		}

		for (const user of users) {
			await usersBySectorAndRole.insertIfDoesNotExist(ctx, user);
		}

		const sectors = await ctx.db.query("sectors").collect();
		const sectorsSummary = await Promise.all(
			sectors.map(async (sector) => {
				const [memberCount, leaderCount, adminCount] = await Promise.all([
					membersBySector.count(ctx, { namespace: sector._id }),
					usersBySectorAndRole.count(ctx, {
						namespace: sector._id,
						bounds: roleBounds("leader"),
					}),
					usersBySectorAndRole.count(ctx, {
						namespace: sector._id,
						bounds: roleBounds("admin"),
					}),
				]);

				return {
					sectorId: sector._id,
					sectorName: sector.name,
					memberCount,
					leaderCount: leaderCount + adminCount,
				};
			}),
		);

		return {
			membersProcessed: members.length,
			usersProcessed: users.length,
			totalMembers: await membersByCreationTime.count(ctx),
			sectors: sectorsSummary,
		};
	},
});
