import { v } from "convex/values";
import { authedMutation } from "./utils";

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
