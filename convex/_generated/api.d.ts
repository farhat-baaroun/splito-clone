/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as files from "../files.js";
import type * as groups from "../groups.js";
import type * as lib_settlement from "../lib/settlement.js";
import type * as members from "../members.js";
import type * as paymentLogs from "../paymentLogs.js";
import type * as payments from "../payments.js";
import type * as sandboxes from "../sandboxes.js";
import type * as settlement from "../settlement.js";
import type * as settlementSnapshots from "../settlementSnapshots.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  files: typeof files;
  groups: typeof groups;
  "lib/settlement": typeof lib_settlement;
  members: typeof members;
  paymentLogs: typeof paymentLogs;
  payments: typeof payments;
  sandboxes: typeof sandboxes;
  settlement: typeof settlement;
  settlementSnapshots: typeof settlementSnapshots;
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

export declare const components: {};
