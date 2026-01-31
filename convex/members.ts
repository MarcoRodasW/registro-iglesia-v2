import { v } from "convex/values";
import { authedMutation, authedQuery } from "./utils";

const memberFields = {
	fullName: v.string(),
	phone: v.string(),
	address: v.string(),
	email: v.optional(v.string()),
	age: v.optional(v.number()),
	childrenCount: v.optional(v.number()),
	firstVisitDate: v.optional(v.number()),
	notes: v.optional(v.string()),
};

const PAGE_SIZE = 25;

// Query: Lista paginada de miembros con filtro por nombre
export const list = authedQuery({
	args: {
		cursor: v.optional(v.string()),
		search: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { cursor, search } = args;

		// Get all members and filter by search if provided
		let query = ctx.db.query("members");

		const allMembers = await query.collect();

		// Filter by search term if provided
		let filteredMembers = allMembers;
		if (search && search.trim() !== "") {
			const searchLower = search.toLowerCase();
			filteredMembers = allMembers.filter((member) =>
				member.fullName.toLowerCase().includes(searchLower),
			);
		}

		// Sort by creation time (newest first)
		filteredMembers.sort((a, b) => b._creationTime - a._creationTime);

		// Implement cursor-based pagination
		let startIndex = 0;
		if (cursor) {
			const cursorIndex = filteredMembers.findIndex((m) => m._id === cursor);
			if (cursorIndex !== -1) {
				startIndex = cursorIndex + 1;
			}
		}

		const pageMembers = filteredMembers.slice(startIndex, startIndex + PAGE_SIZE);
		const hasMore = startIndex + PAGE_SIZE < filteredMembers.length;
		const nextCursor = hasMore ? pageMembers[pageMembers.length - 1]?._id : null;

		// Calculate page info
		const totalCount = filteredMembers.length;
		const currentPage = Math.floor(startIndex / PAGE_SIZE) + 1;
		const totalPages = Math.ceil(totalCount / PAGE_SIZE);

		return {
			members: pageMembers,
			nextCursor,
			hasMore,
			totalCount,
			currentPage,
			totalPages,
			pageSize: PAGE_SIZE,
		};
	},
});

// Query: Total de miembros
export const count = authedQuery({
	args: {},
	handler: async (ctx) => {
		const members = await ctx.db.query("members").collect();
		return members.length;
	},
});

// Mutation: Crear un miembro
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
		});
		return memberId;
	},
});

// Mutation: Crear múltiples miembros (batch)
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
			});
			memberIds.push(memberId);
		}
		return memberIds;
	},
});

// Mutation: Actualizar un miembro
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
		});

		return id;
	},
});

// Mutation: Eliminar un miembro
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
