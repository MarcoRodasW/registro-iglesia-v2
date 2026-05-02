/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aggregates from "../aggregates.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as memberTypes from "../memberTypes.js";
import type * as members from "../members.js";
import type * as migrations from "../migrations.js";
import type * as sectors from "../sectors.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aggregates: typeof aggregates;
  auth: typeof auth;
  http: typeof http;
  memberTypes: typeof memberTypes;
  members: typeof members;
  migrations: typeof migrations;
  sectors: typeof sectors;
  users: typeof users;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  membersByCreation: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"membersByCreation">;
  membersBySector: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"membersBySector">;
  usersBySectorAndRole: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"usersBySectorAndRole">;
};
