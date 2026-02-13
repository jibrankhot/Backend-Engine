/**
 * Hybrid executor decides which DB engine to use (SQL / Supabase),
 * executes the procedure, and handles caching + logging.
 *
 * SECURITY NOTE:
 * Guard is executed in run.ts.
 * Executor should only execute.
 */

import { EngineRequest } from "../contract/request";
import { EngineResponse } from "../contract/response";
import { resolveContext } from "../resolver";
import { runSqlProcedure } from "./sql.executor";
import { runSupabaseProcedure } from "./supabase.executor";
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

    // Resolve DB context
    const ctx = resolveContext(input);
    const { project, dbName, procedure, payload } = ctx;

    const cachedMode = DB_CACHE[project];

    // 1️⃣ Use cached DB mode
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

        /*
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
        */

        // 2️⃣ Try SQL first
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

    // 3️⃣ Supabase fallback (disabled for now)
    /*
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
    */

    // Final failure
    throw {
        type: "SERVER_ERROR",
        message: "SQL execution failed and Supabase fallback is disabled."
    };
}
