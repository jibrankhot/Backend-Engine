/**
 * ============================= DATABASE RESOLVER =============================
 *
 * Ye file decide karti hai:
 * - kaunsa project run ho raha hai
 * - kaunsa database hit hoga
 * - kaunsa stored procedure execute hoga
 * - payload ka final structure kya hoga
 *
 * Backend flow:
 *
 * Client Request
 *      ↓
 * Resolver (THIS FILE)
 *      ↓
 * SQL Executor
 *      ↓
 * SQL Server
 *
 *
 * Resolver ka main kaam:
 *
 * 1) Request se procedure nikalna
 * 2) Master DB vs Tenant DB decide karna
 * 3) Login ke baad companyDb switch karna
 * 4) Payload normalize karna
 * 5) Executor ko clean context dena
 *
 *
 * RULES:
 *
 * Admin/Auth/Setup/System procedures → MASTER DB
 * Baaki sab procedures → TENANT DB (companyDb)
 *
 *
 * Example:
 *
 * AdminLoginProc → masterDb
 * GetOrdersProc → companyDb
 *
 *
 * Ye file business logic nahi likhti.
 * Sirf routing engine hai.
 *
 * =============================================================================
 */

import { getContext } from "./context";
import { EngineRequest } from "./contract/request";

// Procedures jo hamesha MASTER DB se run honge
const MASTER_PREFIX = ["Admin", "Auth", "Setup", "System"];


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

    // Project resolution
    const project = input.project || cfg.project || "default";

    // Procedure resolution (new contract priority)
    const procedure =
        input.action?.procedure ||
        (input as any)?.procedure; // backward compatibility

    if (!procedure) {
        throw new Error("Procedure name is required in request");
    }


    // ===============================
    // DATABASE DECISION LOGIC
    // ===============================

    let dbName: string | undefined;

    // Check if procedure belongs to master DB
    const isMaster = MASTER_PREFIX.some(prefix =>
        procedure.startsWith(prefix)
    );

    if (isMaster) {
        // Admin/Auth/System → setup DB
        dbName = cfg.masterDb;
    } else {
        // Tenant routing
        dbName =
            input.auth?.companyDb || // preferred
            cfg.clientDb;            // fallback
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
    // DEV LOGGING (auto disable prod)
    // ===============================

    if (process.env.NODE_ENV === "development") {
        console.log("RESOLVER → DB:", dbName, "| PROC:", procedure);
    }


    return {
        project,
        dbName,
        procedure,
        payload,
    };
}
