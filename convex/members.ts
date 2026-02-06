import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { authedMutation, authedQuery } from "./utils";
import { memberFieldsValidator } from "./memberTypes";

// Extract fields from the shared validator for use in mutations
const memberFields = memberFieldsValidator.fields;

// Query: Lista paginada de miembros con filtro por nombre usando paginación nativa de Convex
export const list = authedQuery({
	args: {
		paginationOpts: paginationOptsValidator,
		search: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { paginationOpts, search } = args;

		// Get all members ordered by creation time (newest first)
		// Note: For large datasets, consider using an index
		const allMembers = await ctx.db.query("members").order("desc").collect();

		// Filter by search term if provided (case-insensitive)
		let filteredMembers = allMembers;
		if (search && search.trim() !== "") {
			const searchLower = search.toLowerCase();
			filteredMembers = allMembers.filter((member) =>
				member.fullName.toLowerCase().includes(searchLower),
			);
		}

		// Manual cursor-based pagination
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
		const continueCursor =
			pageMembers.length > 0 ? pageMembers[pageMembers.length - 1]._id : cursor;

		return {
			page: pageMembers,
			continueCursor,
			isDone,
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
