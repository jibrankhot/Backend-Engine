/**
 * This file resolves the execution context for each request.
 * It determines the project, database name (for SQL), procedure, and payload
 * before passing the request to the executor layer.
 */

import { getContext } from "./context";
import { EngineRequest } from "./contract/request";

/** Procedure prefixes that must use master database (setup/auth/system DB) */
const MASTER_PREFIX = ["Admin", "Auth", "Setup", "System"];

export interface ResolvedContext {
    project: string;
    dbName?: string; // used only for SQL Server
    procedure: string;
    payload: {
        params?: Record<string, any>;
        data?: Record<string, any>;
    };
}

/**
 * Resolves project, database name, procedure, and payload from the request.
 */
export function resolveContext(input: EngineRequest): ResolvedContext {
    const cfg = getContext();

    const project = input.project || cfg.project || "default";
    const procedure = input.procedure;

    if (!procedure) {
        throw new Error("Procedure name is required");
    }

    // Decide SQL database name (master or client DB)
    let dbName: string | undefined;

    const isMaster = MASTER_PREFIX.some(prefix =>
        procedure.startsWith(prefix)
    );

    // Admin/Auth/Setup/System → setup DB
    // Everything else → client DB
    dbName = isMaster ? cfg.masterDb : cfg.clientDb;

    // Build normalized payload
    const payload = {
        params: input.payload?.params || {},
        data: input.payload?.data || {},
    };

    // Debug log (keep during development)
    console.log("RESOLVER DB:", dbName, "PROC:", procedure);

    return {
        project,
        dbName,
        procedure,
        payload,
    };
}
