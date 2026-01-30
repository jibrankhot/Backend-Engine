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
        sqlPools[dbName] = await sql.connect({
            ...SQL_CONFIG,
            database: dbName,
        });
    }
    return sqlPools[dbName];
}

/**
 * Builds payload structure sent to SQL procedures.
 */
function buildSqlPayload(payload: any) {
    return {
        ParamObj: payload?.params || {},
        DataObj: payload?.data || {},
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

    const { ParamObj, DataObj } = buildSqlPayload(payload);

    request.input("ParamObj", sql.NVarChar(sql.MAX), JSON.stringify(ParamObj));
    request.input("DataObj", sql.NVarChar(sql.MAX), JSON.stringify(DataObj));

    const start = Date.now();
    const result = await request.execute(procedure);
    const durationMs = Date.now() - start;

    return normalizeSqlResult(result, {
        project,
        db: "sql",
        durationMs,
    });
}
