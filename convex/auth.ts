import { betterAuth } from "better-auth/minimal";
import { createClient, type AuthFunctions } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import authConfig from "./auth.config";
import { components, internal } from "./_generated/api";
import { query } from "./_generated/server";
import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "./_generated/dataModel";

const siteUrl = process.env.SITE_URL!;

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
	authFunctions,
	triggers: {
		user: {
			onCreate: async (ctx, doc) => {
				const existingUsers = await ctx.db.query("users").first();
				const role = existingUsers === null ? "admin" : "user";
				await ctx.db.insert("users", {
					name: doc.name,
					email: doc.email,
					authId: doc._id,
					role,
				});
			},
			onUpdate: async (ctx, newDoc, oldDoc) => {
				if (newDoc.email !== oldDoc.email || newDoc.name !== oldDoc.name) {
					const user = await ctx.db
						.query("users")
						.withIndex("by_authId", (q) => q.eq("authId", newDoc._id))
						.unique();
					if (user) {
						await ctx.db.patch(user._id, {
							email: newDoc.email,
							name: newDoc.name,
						});
					}
				}
			},
			onDelete: async (ctx, doc) => {
				const user = await ctx.db
					.query("users")
					.withIndex("by_authId", (q) => q.eq("authId", doc._id))
					.unique();
				if (user) {
					await ctx.db.delete(user._id);
				}
			},
		},
	},
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth({
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			enabled: true,
			minPasswordLength: 5,
			requireEmailVerification: false,
		},
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID!,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			},
		},
		plugins: [
			convex({ authConfig }),
		],
	});
};

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return await authComponent.getAuthUser(ctx);
	},
});
