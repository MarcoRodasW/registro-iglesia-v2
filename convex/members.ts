import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { membersByCreationTime, membersBySector } from "./aggregates";
import { mutation, query } from "./_generated/server";
import { authedMutation, authedQuery } from "./utils";
import { memberFieldsValidator } from "./memberTypes";

const memberFields = memberFieldsValidator.fields;

export const list = authedQuery({
	args: {
		paginationOpts: v.optional(paginationOptsValidator),
		search: v.optional(v.string()),
	},
	handler: async (ctx) => {
		return await ctx.db.query("members").order("desc").collect();
	},
});

export const count = authedQuery({
	args: {},
	handler: async (ctx) => membersByCreationTime.count(ctx),
});

export const countNewThisMonth = authedQuery({
	args: {},
	handler: async (ctx) => {
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);
		const startTimestamp = startOfMonth.getTime();
		return await membersByCreationTime.count(ctx, {
			bounds: { lower: { key: startTimestamp, inclusive: true } },
		});
	},
});

export const getMemberById = authedQuery({
	args: { id: v.id("members") },
	handler: async (ctx, args) => {
		const member = await ctx.db.get(args.id);
		if (!member) return null;
		return { id: member._id, fullName: member.fullName };
	},
});

export const searchMembers = authedQuery({
	args: {
		search: v.optional(v.string()),
		limit: v.optional(v.number()),
		excludeId: v.optional(v.id("members")),
	},
	handler: async (ctx, args) => {
		const { search, limit = 20, excludeId } = args;

		const allMembers = await ctx.db.query("members").order("desc").collect();

		let filtered = allMembers;

		// Exclude a specific member (useful when editing to prevent self-reference)
		if (excludeId) {
			filtered = filtered.filter((m) => m._id !== excludeId);
		}

		// Filter by search term
		if (search && search.trim() !== "") {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter((member) =>
				member.fullName.toLowerCase().includes(searchLower),
			);
		}

		// Return limited results
		return filtered.slice(0, limit).map((m) => ({
			id: m._id,
			fullName: m.fullName,
		}));
	},
});

export const createMember = authedMutation({
	args: memberFields,
	handler: async (ctx, args) => {
		const memberId = await ctx.db.insert("members", {
			fullName: args.fullName,
			phone: args.phone,
			address: args.address,
			email: args.email,
			age: args.age,
			childrenCount: args.childrenCount,
			firstVisitDate: args.firstVisitDate,
			notes: args.notes,
			invitedBy: args.invitedBy,
			invitedByName: args.invitedByName,
			sectorId: args.sectorId,
		});

		const member = await ctx.db.get(memberId);
		if (!member) {
			throw new Error("Member was not created");
		}

		await Promise.all([
			membersByCreationTime.insertIfDoesNotExist(ctx, member),
			membersBySector.insertIfDoesNotExist(ctx, member),
		]);

		return memberId;
	},
});

export const createMembersBatch = authedMutation({
	args: {
		members: v.array(memberFieldsValidator),
	},
	handler: async (ctx, args) => {
		const memberIds: string[] = [];
		for (const member of args.members) {
			const memberId = await ctx.db.insert("members", {
				fullName: member.fullName,
				phone: member.phone,
				address: member.address,
				email: member.email,
				age: member.age,
				childrenCount: member.childrenCount,
				firstVisitDate: member.firstVisitDate,
				notes: member.notes,
				invitedBy: member.invitedBy,
				invitedByName: member.invitedByName,
				sectorId: member.sectorId,
			});

			const createdMember = await ctx.db.get(memberId);
			if (!createdMember) {
				throw new Error("Member was not created");
			}

			await Promise.all([
				membersByCreationTime.insertIfDoesNotExist(ctx, createdMember),
				membersBySector.insertIfDoesNotExist(ctx, createdMember),
			]);

			memberIds.push(memberId);
		}
		return memberIds;
	},
});

export const updateMember = authedMutation({
	args: {
		id: v.id("members"),
		...memberFields,
	},
	handler: async (ctx, args) => {
		const { id, ...fields } = args;

		const existing = await ctx.db.get(id);
		if (!existing) {
			throw new Error("Member not found");
		}

		await ctx.db.patch(id, {
			fullName: fields.fullName,
			phone: fields.phone,
			address: fields.address,
			email: fields.email,
			age: fields.age,
			childrenCount: fields.childrenCount,
			firstVisitDate: fields.firstVisitDate,
			notes: fields.notes,
			invitedBy: fields.invitedBy,
			sectorId: fields.sectorId,
			invitedByName: fields.invitedByName,
		});

		const updated = await ctx.db.get(id);
		if (!updated) {
			throw new Error("Member not found");
		}

		await Promise.all([
			membersByCreationTime.replaceOrInsert(ctx, existing, updated),
			membersBySector.replaceOrInsert(ctx, existing, updated),
		]);

		return id;
	},
});

export const deleteMember = authedMutation({
	args: {
		id: v.id("members"),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db.get(args.id);
		if (!existing) {
			throw new Error("Member not found");
		}

		await ctx.db.delete(args.id);
		await Promise.all([
			membersByCreationTime.deleteIfExists(ctx, existing),
			membersBySector.deleteIfExists(ctx, existing),
		]);
		return args.id;
	},
});

export const getMemberGrowthTrend = authedQuery({
	args: {},
	handler: async (ctx) => {
		const now = new Date();

		// Calculate data for last 6 months
		const monthsData: Array<{
			label: string;
			count: number;
			timestamp: number;
		}> = [];

		for (let i = 5; i >= 0; i--) {
			const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const nextMonthDate = new Date(
				now.getFullYear(),
				now.getMonth() - i + 1,
				1,
			);

			const count = await membersByCreationTime.count(ctx, {
				bounds: {
					lower: { key: monthDate.getTime(), inclusive: true },
					upper: { key: nextMonthDate.getTime(), inclusive: false },
				},
			});

			const monthNames = [
				"Ene",
				"Feb",
				"Mar",
				"Abr",
				"May",
				"Jun",
				"Jul",
				"Ago",
				"Sep",
				"Oct",
				"Nov",
				"Dic",
			];

			monthsData.push({
				label: monthNames[monthDate.getMonth()],
				count,
				timestamp: monthDate.getTime(),
			});
		}

		// Calculate current month vs previous
		const currentMonth = monthsData[5].count;
		const previousMonth = monthsData[4].count;
		const difference = currentMonth - previousMonth;
		const trend: "up" | "down" | "stable" =
			difference > 0 ? "up" : difference < 0 ? "down" : "stable";

		// Total members
		const totalMembers = await membersByCreationTime.count(ctx);

		// Calculate average per month for last 3 months
		const last3Months = monthsData.slice(3);
		const avgGrowth = Math.round(
			last3Months.reduce((sum, m) => sum + m.count, 0) / 3,
		);

		return {
			monthsData,
			currentMonth,
			previousMonth,
			difference,
			trend,
			totalMembers,
			avgGrowth,
		};
	},
});

export const listMembersBySector = authedQuery({
	args: {
		sectorId: v.id("sectors"),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("members")
			.withIndex("by_sector", (q) => q.eq("sectorId", args.sectorId))
			.collect();
	},
});

export const getPublicRegistrationLinkInfo = query({
	args: {
		token: v.string(),
	},
	handler: async (ctx, args) => {
		const sector = await ctx.db
			.query("sectors")
			.withIndex("by_registrationToken", (q) =>
				q.eq("registrationToken", args.token),
			)
			.unique();

		if (!sector) {
			return {
				isValid: false,
				message: "El enlace no existe o fue invalidado.",
				sectorName: null,
			};
		}

		return {
			isValid: true,
			message: null,
			sectorName: sector.name,
		};
	},
});

export const registerFromSectorLink = mutation({
	args: {
		token: v.string(),
		fullName: v.string(),
		phone: v.string(),
		address: v.string(),
		email: v.optional(v.string()),
		age: v.optional(v.number()),
		childrenCount: v.optional(v.number()),
		firstVisitDate: v.optional(v.number()),
		invitedByName: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const sector = await ctx.db
			.query("sectors")
			.withIndex("by_registrationToken", (q) =>
				q.eq("registrationToken", args.token),
			)
			.unique();

		if (!sector) {
			throw new Error("Invalid registration link");
		}

		const memberId = await ctx.db.insert("members", {
			fullName: args.fullName,
			phone: args.phone,
			address: args.address,
			email: args.email,
			age: args.age,
			childrenCount: args.childrenCount,
			firstVisitDate: args.firstVisitDate,
			notes: undefined,
			invitedBy: undefined,
			invitedByName: args.invitedByName,
			sectorId: sector._id,
		});

		const member = await ctx.db.get(memberId);
		if (!member) {
			throw new Error("Member was not created");
		}

		await Promise.all([
			membersByCreationTime.insertIfDoesNotExist(ctx, member),
			membersBySector.insertIfDoesNotExist(ctx, member),
		]);

		return {
			memberId,
			sectorName: sector.name,
		};
	},
});
