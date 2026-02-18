import { paginationOptsValidator } from "convex/server";
import type { PaginationResult } from "convex/server";
import { v } from "convex/values";
import { authedMutation, authedQuery } from "./utils";
import { memberFieldsValidator } from "./memberTypes";
import type { Doc } from "./_generated/dataModel";

const memberFields = memberFieldsValidator.fields;

export const list = authedQuery({
	args: {
		paginationOpts: paginationOptsValidator,
		search: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<PaginationResult<Doc<"members">>> => {
		const { paginationOpts, search } = args;

		const allMembers = await ctx.db.query("members").order("desc").collect();

		let filteredMembers = allMembers;
		if (search && search.trim() !== "") {
			const searchLower = search.toLowerCase();
			filteredMembers = allMembers.filter((member) =>
				member.fullName.toLowerCase().includes(searchLower),
			);
		}

		const cursor = paginationOpts.cursor;
		let startIndex = 0;

		if (cursor) {
			const cursorIndex = filteredMembers.findIndex((m) => m._id === cursor);
			if (cursorIndex !== -1) {
				startIndex = cursorIndex + 1;
			}
		}

		const pageMembers = filteredMembers.slice(
			startIndex,
			startIndex + paginationOpts.numItems,
		);
		const isDone =
			startIndex + paginationOpts.numItems >= filteredMembers.length;
		const continueCursor: string =
			pageMembers.length > 0
				? pageMembers[pageMembers.length - 1]._id
				: paginationOpts.cursor ?? "";

		return {
			page: pageMembers,
			continueCursor,
			isDone,
		};
	},
});

export const count = authedQuery({
	args: {},
	handler: async (ctx) => {
		const members = await ctx.db.query("members").collect();
		return members.length;
	},
});

export const countNewThisMonth = authedQuery({
	args: {},
	handler: async (ctx) => {
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);
		const startTimestamp = startOfMonth.getTime();

		const members = await ctx.db.query("members").collect();
		const newMembers = members.filter(
			(member) => member._creationTime >= startTimestamp,
		);

		return newMembers.length;
	},
});

export const getGrowthRate = authedQuery({
	args: { period: v.union(v.literal("week"), v.literal("month")) },
	handler: async (ctx, args) => {
		const now = Date.now();
		let currentStart: number;
		let previousStart: number;
		let previousEnd: number;

		if (args.period === "week") {
			// Last 7 days
			currentStart = now - 7 * 24 * 60 * 60 * 1000;
			// 7-14 days ago
			previousStart = now - 14 * 24 * 60 * 60 * 1000;
			previousEnd = currentStart;
		} else {
			// Current month
			const startOfMonth = new Date();
			startOfMonth.setDate(1);
			startOfMonth.setHours(0, 0, 0, 0);
			currentStart = startOfMonth.getTime();

			// Previous month
			const startOfPrevMonth = new Date(startOfMonth);
			startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
			previousStart = startOfPrevMonth.getTime();
			previousEnd = currentStart;
		}

		const members = await ctx.db.query("members").collect();

		const currentCount = members.filter(
			(m) => m._creationTime >= currentStart,
		).length;

		const previousCount = members.filter(
			(m) => m._creationTime >= previousStart && m._creationTime < previousEnd,
		).length;

		let growthRate: number | null = null;
		if (previousCount > 0) {
			growthRate = ((currentCount - previousCount) / previousCount) * 100;
		}

		return {
			growthRate,
			currentCount,
			previousCount,
		};
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
			sectorId: args.sectorId,
		});
		return memberId;
	},
});

export const createMembersBatch = authedMutation({
	args: {
		members: v.array(v.object(memberFields)),
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
				sectorId: member.sectorId,
			});
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
		});

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
		return args.id;
	},
});

export const getMemberGrowthTrend = authedQuery({
	args: {},
	handler: async (ctx) => {
		const members = await ctx.db.query("members").collect();
		const now = new Date();

		// Calculate data for last 6 months
		const monthsData: Array<{
			label: string;
			count: number;
			timestamp: number;
		}> = [];

		for (let i = 5; i >= 0; i--) {
			const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

			const count = members.filter(
				(m) =>
					m._creationTime >= monthDate.getTime() &&
					m._creationTime <= monthEnd.getTime(),
			).length;

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
		const totalMembers = members.length;

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
