import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	members: defineTable({
		fullName: v.string(),
		phone: v.string(),
		address: v.string(),
		email: v.optional(v.string()),
		age: v.optional(v.number()),
		childrenCount: v.optional(v.number()),
		firstVisitDate: v.optional(v.number()),
		notes: v.optional(v.string()),
		invitedBy: v.optional(v.id("members")),
	})
		.index("by_phone", ["phone"])
		.index("by_email", ["email"]),
	users: defineTable({
		name: v.string(),
		email: v.string(),
		authId: v.string(),
		role: v.union(v.literal("admin"), v.literal("user")),
	})
		.index("by_authId", ["authId"])
		.index("by_email", ["email"]),
});
