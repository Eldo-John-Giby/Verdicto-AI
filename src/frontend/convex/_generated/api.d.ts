/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as biasReports from "../biasReports.js";
import type * as cases from "../cases.js";
import type * as comparison from "../comparison.js";
import type * as documents from "../documents.js";
import type * as hackathonFeatures from "../hackathonFeatures.js";
import type * as http from "../http.js";
import type * as mlBiasAnalysis from "../mlBiasAnalysis.js";
import type * as predictions from "../predictions.js";
import type * as queries from "../queries.js";
import type * as rag from "../rag.js";
import type * as timeline from "../timeline.js";
import type * as users from "../users.js";
import type * as verdictNotes from "../verdictNotes.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  biasReports: typeof biasReports;
  cases: typeof cases;
  comparison: typeof comparison;
  documents: typeof documents;
  hackathonFeatures: typeof hackathonFeatures;
  http: typeof http;
  mlBiasAnalysis: typeof mlBiasAnalysis;
  predictions: typeof predictions;
  queries: typeof queries;
  rag: typeof rag;
  timeline: typeof timeline;
  users: typeof users;
  verdictNotes: typeof verdictNotes;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
