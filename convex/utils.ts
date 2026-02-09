import {
	customCtx,
	customMutation,
	customQuery,
} from "convex-helpers/server/customFunctions";
import { authComponent } from "./auth";
import type { DataModel } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { GenericCtx } from "@convex-dev/better-auth";
import type { GenericQueryCtx } from "convex/server";

const authenticatedCtx = customCtx(async (ctx: GenericCtx<DataModel>) => {
	const user = await authComponent.getAuthUser(ctx);
	if (!user) {
		throw new Error("User must be authenticated");
	}
	return { user };
});

const adminCtx = customCtx(async (ctx: GenericQueryCtx<DataModel>) => {
	const authUser = await authComponent.getAuthUser(ctx);
	if (!authUser) {
		throw new Error("User must be authenticated");
	}
	const appUser = await ctx.db
		.query("users")
		.withIndex("by_authId", (q) => q.eq("authId", authUser._id))
		.unique();
	if (!appUser || appUser.role !== "admin") {
		throw new Error("User must be an admin");
	}
	return { user: authUser, appUser };
});

export const authedQuery = customQuery(query, authenticatedCtx);
export const authedMutation = customMutation(mutation, authenticatedCtx);
export const adminQuery = customQuery(query, adminCtx);
export const adminMutation = customMutation(mutation, adminCtx);
