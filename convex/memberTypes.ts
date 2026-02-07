import type { Infer } from "convex/values";
import { v } from "convex/values";

export const memberFieldsValidator = v.object({
	fullName: v.string(),
	phone: v.string(),
	address: v.string(),
	email: v.optional(v.string()),
	age: v.optional(v.number()),
	childrenCount: v.optional(v.number()),
	firstVisitDate: v.optional(v.number()),
	notes: v.optional(v.string()),
	invitedBy: v.optional(v.id("members")),
});

export type MemberFields = Infer<typeof memberFieldsValidator>;
