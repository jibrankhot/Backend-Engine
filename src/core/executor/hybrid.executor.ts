/**
 * This file decides which database engine to use (SQL or Supabase),
 * validates procedure access, executes the procedure, and handles
 * auto-detection, caching, and fallback.
 */

import { EngineRequest } from "../contract/request";
import { EngineResponse } from "../contract/response";
import { resolveContext } from "../resolver";
import { runSqlProcedure } from "./sql.executor";
import { runSupabaseProcedure } from "./supabase.executor";
import { guardProcedure } from "../security/procedure.guard";

// ===============================
// DB MODE CACHE (per project)
// ===============================

const DB_CACHE: Record<string, "sql" | "supabase"> = {};

/**
 * Executes a procedure using the hybrid database engine.
 */
export async function runProcedure(
    input: EngineRequest
): Promise<EngineResponse> {
    const ctx = resolveContext(input);

    const { project, dbName, procedure, payload } = ctx;

    // 1) Security check: validate procedure access
    guardProcedure(project, procedure);

    const cachedMode = DB_CACHE[project];

    // 2) If DB mode already detected, use it directly
    try {
        if (cachedMode === "sql" && dbName) {
            return await runSqlProcedure(dbName, procedure, payload, project);
        }

        if (cachedMode === "supabase") {
            return await runSupabaseProcedure(procedure, payload, project);
        }

        // 3) Try SQL first
        if (dbName) {
            const res = await runSqlProcedure(dbName, procedure, payload, project);
            DB_CACHE[project] = "sql";
            return res;
        }
    } catch (err: any) {
        // SQL failed → fallback to Supabase
    }

    // 4) Fallback to Supabase
    const res = await runSupabaseProcedure(procedure, payload, project);
    DB_CACHE[project] = "supabase";
    return res;
}
