/**
 * ============================= SQL EXECUTOR (CORE ENGINE) =============================
 *
 * Ye backend engine ka SABSE IMPORTANT file hai.
 * Yahin se actual database execution hota hai.
 *
 * Backend flow samjho:
 *
 * Angular / Client
 *        ↓
 * API Route (/api/run)
 *        ↓
 * DB Resolver (decides DB)
 *        ↓
 * SQL Executor (THIS FILE)
 *        ↓
 * Stored Procedure (SQL Server)
 *        ↓
 * Response normalize karke client ko wapas
 *
 *
 * Ye file kya handle karti hai:
 *
 * 1) SQL connection pooling (per database)
 * 2) Stored procedure execution
 * 3) ParamObj / FormObj SQL ko bhejna
 * 4) SQL recordsets ko normalize karna
 * 5) Execution time measure karna
 * 6) SQL errors ko safe response me convert karna
 * 7) Universal response contract follow karna
 *
 *
 * IMPORTANT:
 * - Yahan koi business logic nahi hota
 * - Sirf transport + execution layer hai
 * - Reusable across ALL projects
 *
 * Agar ye file strong hai → poora backend reusable engine ban jata hai.
 *
 * =============================================================================
 */

import sql from "mssql";
import { SQL_CONFIG } from "../../config/db";
import { EngineResponse, ResponseMeta, DataSet } from "../contract/response";


// ===============================
// SQL POOL CACHE (per database)
// ===============================

const sqlPools: Record<string, sql.ConnectionPool> = {};

/**
 * Har database ke liye ek hi connection pool banega.
 * Performance improve hoti hai.
 */
async function getSqlPool(dbName: string) {
    if (!sqlPools[dbName]) {
        const pool = new sql.ConnectionPool({
            ...SQL_CONFIG,
            database: dbName,
        });

        sqlPools[dbName] = await pool.connect();
    }

    return sqlPools[dbName];
}


// ===============================
// PAYLOAD BUILDER
// ===============================

/**
 * Request contract ko SQL procedure ke format me convert karta hai.
 *
 * SQL side expects:
 * ParamObj
 * FormObj
 */
function buildSqlPayload(payload: any, action: any) {
    return {
        ParamObj: payload?.params || action?.params || {},
        FormObj: payload?.data || action?.form || {},
    };
}


// ===============================
// DATASET NORMALIZATION
// ===============================

/**
 * SQL recordsets ko universal dataset me convert karta hai.
 */
function normalizeRecordsets(recordsets: any[]): DataSet {
    const tables: Record<string, unknown[]> = {};

    recordsets.forEach((set, index) => {
        tables[`table${index + 1}`] = set;
    });

    return { tables };
}


// ===============================
// RESULT → ENGINE RESPONSE
// ===============================

function normalizeSqlResult(result: any, meta: ResponseMeta): EngineResponse {

    const recordsets = Array.isArray(result?.recordsets)
        ? result.recordsets
        : Object.values(result?.recordsets || {});

    const firstRow = recordsets?.[0]?.[0] || {};

    return {
        status: {
            code: firstRow.StatusCode ?? 200,
            success: (firstRow.StatusCode ?? 200) < 400,
            message: firstRow.Message ?? "Success",
        },

        data: normalizeRecordsets(recordsets),

        meta,

        // backward compatibility
        statusCode: firstRow.StatusCode ?? 200,
        message: firstRow.Message ?? "Success",
    };
}


// ===============================
// ERROR → ENGINE RESPONSE
// ===============================

function mapSqlError(err: any, meta: ResponseMeta): EngineResponse {

    return {
        status: {
            code: 500,
            success: false,
            message: "Database execution failed",
        },

        error: {
            code: "SQL_EXECUTION_ERROR",
            message: "Stored procedure execution failed",
            details: process.env.NODE_ENV === "development" ? err?.message : undefined,
        },

        meta,
    };
}


// ===============================
// MAIN EXECUTOR FUNCTION
// ===============================

/**
 * Stored procedure run karta hai.
 *
 * Steps:
 * 1) Pool fetch
 * 2) SQL request create
 * 3) ParamObj/FormObj bind
 * 4) Procedure execute
 * 5) Result normalize
 * 6) Error mapping
 */
export async function runSqlProcedure(
    dbName: string,
    procedure: string,
    payload: any,
    project: string,
    action?: any
): Promise<EngineResponse> {

    const start = Date.now();

    const meta: ResponseMeta = {
        timestamp: start,
        db: "sql",
        procedure,
        companyDb: dbName,
    };

    try {
        const pool = await getSqlPool(dbName);
        const request = pool.request();

        const { ParamObj, FormObj } = buildSqlPayload(payload, action);

        request.input("ParamObj", sql.NVarChar(sql.MAX), JSON.stringify(ParamObj));
        request.input("FormObj", sql.NVarChar(sql.MAX), JSON.stringify(FormObj));

        const result = await request.execute(`dbo.${procedure}`);

        meta.durationMs = Date.now() - start;

        return normalizeSqlResult(result, meta);

    } catch (err: any) {

        meta.durationMs = Date.now() - start;

        console.error("SQL EXECUTION ERROR:", err);

        return mapSqlError(err, meta);
    }
}
