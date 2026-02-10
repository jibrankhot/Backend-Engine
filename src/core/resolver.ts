/**
 * ============================= DATABASE RESOLVER =============================
 *
 * FINAL PHASE-2 RESOLVER
 *
 * DB resolution ab:
 * registry → engine.config → ENV.engineDb
 *
 * Context se DB dependency hata di gayi hai.
 * Engine portable ho gaya.
 *
 * =============================================================================
 */

import { getContext } from "./context";
import { EngineRequest } from "./contract/request";
import { getProcedureDb } from "./resolver/procedure.registry";
import { getEngineConfig } from "../config/engine.loader";
import { ENV } from "../config/env";

export interface ResolvedContext {
    project: string;
    dbName?: string;
    procedure: string;
    payload: {
        params?: Record<string, unknown>;
        data?: Record<string, unknown>;
    };
}

/**
 * Request ko executor-friendly format me convert karta hai.
 */
export function resolveContext(input: EngineRequest): ResolvedContext {

    const cfg = getContext();
    const engineConfig = getEngineConfig();

    // Project resolution
    const project = input.project || cfg.project || "default";

    // Procedure resolution
    const procedure =
        input.action?.procedure ||
        (input as any)?.procedure;

    if (!procedure) {
        throw new Error("Procedure name is required in request");
    }

    // ===============================
    // DATABASE DECISION — ENGINE DRIVEN
    // ===============================

    let dbName: string | undefined;

    // STEP 1: registry se DB type nikalo
    const dbType = getProcedureDb(project, procedure);
    // MASTER | TENANT

    // STEP 2: engine.config se mapping nikalo
    const mapping = engineConfig.database.mapping[dbType];

    if (!mapping) {
        throw new Error(`No DB mapping found for type: ${dbType}`);
    }

    // STEP 3: ENV se actual DB name resolve karo
    if (dbType === "MASTER") {
        dbName = ENV.engineDb.master;
    } else {
        dbName =
            input.auth?.companyDb ||        // tenant DB from login
            ENV.engineDb.tenantDefault;     // fallback tenant DB
    }

    if (!dbName) {
        throw new Error(`Database name not resolved for type: ${dbType}`);
    }

    // ===============================
    // PAYLOAD NORMALIZATION
    // ===============================

    const payload = {
        params:
            input.action?.params ||
            input.payload?.params ||
            {},

        data:
            input.action?.form ||
            input.payload?.data ||
            {},
    };

    // ===============================
    // DEV LOGGING
    // ===============================

    if (process.env.NODE_ENV === "development") {
        console.log(
            "RESOLVER → PROJECT:", project,
            "| DB:", dbName,
            "| PROC:", procedure,
            "| TYPE:", dbType
        );
    }

    return {
        project,
        dbName,
        procedure,
        payload,
    };
}
