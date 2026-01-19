import {
    customCtx,
    customMutation,
    customQuery,
} from "convex-helpers/server/customFunctions";
import { authComponent } from "./auth";
import type { DataModel } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { GenericCtx } from "@convex-dev/better-auth";

const authenticatedCtx = customCtx(async (ctx: GenericCtx<DataModel>) => {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) {
    throw new Error("User must be authenticated");
  }
  return { user };
});

export const authedQuery = customQuery(query, authenticatedCtx);
export const authedMutation = customMutation(mutation, authenticatedCtx);
