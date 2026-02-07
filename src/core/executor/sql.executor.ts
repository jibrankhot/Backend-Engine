/**
 * This file executes SQL Server procedures.
 * It manages SQL connection pools, sends payload to procedures,
 * and normalizes SQL results into the engine response format.
 */

import sql from "mssql";
import { SQL_CONFIG } from "../../config/db";
import { EngineResponse } from "../contract/response";

// ===============================
// SQL POOL CACHE (per database)
// ===============================

const sqlPools: Record<string, sql.ConnectionPool> = {};

/**
 * Returns a cached SQL connection pool for a database.
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

/**
 * Builds payload structure sent to SQL procedures.
 */
function buildSqlPayload(payload: any) {
    return {
        ParamObj: payload?.params || {},
        FormObj: payload?.data || {},
    };
}

/**
 * Normalizes SQL Server result into engine response format.
 */
function normalizeSqlResult(result: any, meta: any): EngineResponse {
    const recordsets = Array.isArray(result?.recordsets)
        ? result.recordsets
        : Object.values(result?.recordsets || {});

    const firstRow = recordsets?.[0]?.[0] || {};

    return {
        statusCode: firstRow.StatusCode ?? 200,
        message: firstRow.Message ?? "Success",
        data: recordsets,
        meta,
    };
}

/**
 * Executes a SQL Server stored procedure.
 */
export async function runSqlProcedure(
    dbName: string,
    procedure: string,
    payload: any,
    project: string
): Promise<EngineResponse> {
    const pool = await getSqlPool(dbName);
    const request = pool.request();

    const { ParamObj, FormObj } = buildSqlPayload(payload);

    // Send parameters EXACTLY as SQL proc expects
    request.input("ParamObj", sql.NVarChar(sql.MAX), JSON.stringify(ParamObj));
    request.input("FormObj", sql.NVarChar(sql.MAX), JSON.stringify(FormObj));

    const start = Date.now();

    try {
        const result = await request.execute(`dbo.${procedure}`);
        const durationMs = Date.now() - start;

        return normalizeSqlResult(result, {
            project,
            db: "sql",
            durationMs,
        });
    } catch (err: any) {
        console.error("SQL EXECUTION ERROR:", err);
        throw err;
    }
}
