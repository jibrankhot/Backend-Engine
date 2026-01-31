/**
 * This file decides which database engine to use (SQL or Supabase),
 * validates procedure access, executes the procedure, and handles
 * auto-detection, caching, logging, and fallback.
 */

import { EngineRequest } from "../contract/request";
import { EngineResponse } from "../contract/response";
import { resolveContext } from "../resolver";
import { runSqlProcedure } from "./sql.executor";
import { runSupabaseProcedure } from "./supabase.executor";
import { guardProcedure } from "../security/procedure.guard";
import { logSuccess, logError } from "../logger/logger";

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
    const start = Date.now();

    const ctx = resolveContext(input);
    const { project, dbName, procedure, payload } = ctx;

    // Security check
    guardProcedure(project, procedure);

    const cachedMode = DB_CACHE[project];

    // 1) Use cached DB mode
    try {
        if (cachedMode === "sql" && dbName) {
            const res = await runSqlProcedure(dbName, procedure, payload, project);
            logSuccess({
                project,
                procedure,
                db: "sql",
                durationMs: Date.now() - start,
            });
            return res;
        }

        if (cachedMode === "supabase") {
            const res = await runSupabaseProcedure(procedure, payload, project);
            logSuccess({
                project,
                procedure,
                db: "supabase",
                durationMs: Date.now() - start,
            });
            return res;
        }

        // 2) Try SQL first
        if (dbName) {
            const res = await runSqlProcedure(dbName, procedure, payload, project);
            DB_CACHE[project] = "sql";

            logSuccess({
                project,
                procedure,
                db: "sql",
                durationMs: Date.now() - start,
            });

            return res;
        }
    } catch (err: any) {
        logError({ project, procedure, db: "sql" }, err);
    }

    // 3) Fallback to Supabase
    try {
        const res = await runSupabaseProcedure(procedure, payload, project);
        DB_CACHE[project] = "supabase";

        logSuccess({
            project,
            procedure,
            db: "supabase",
            durationMs: Date.now() - start,
        });

        return res;
    } catch (err: any) {
        logError({ project, procedure, db: "supabase" }, err);
        throw err;
    }
}
