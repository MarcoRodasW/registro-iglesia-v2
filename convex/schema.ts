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
		sectorId: v.optional(v.id("sectors")),
		invitedByName: v.optional(v.string()),
	})
		.index("by_phone", ["phone"])
		.index("by_email", ["email"])
		.index("by_sector", ["sectorId"]),
	users: defineTable({
		name: v.string(),
		email: v.string(),
		authId: v.string(),
		role: v.union(v.literal("admin"), v.literal("leader"), v.literal("user")),
		sectorId: v.optional(v.id("sectors")),
		avatar: v.optional(v.string()),
	})
		.index("by_authId", ["authId"])
		.index("by_email", ["email"])
		.index("by_sector", ["sectorId"]),
	sectors: defineTable({
		name: v.string(),
		description: v.optional(v.string()),
		leaderIds: v.optional(v.array(v.id("users"))),
	})
		.index("by_name", ["name"])
		.index("by_leader", ["leaderIds"]),
});
