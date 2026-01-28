import sql from "mssql";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SQL_CONFIG } from "../config/db";
import { ENV } from "../config/env";

// ===============================
// SQL POOL MANAGER (PER DATABASE)
// ===============================

const sqlPools: Record<string, sql.ConnectionPool> = {};

async function getSqlPool(dbName: string): Promise<sql.ConnectionPool> {
    if (!sqlPools[dbName]) {
        sqlPools[dbName] = await sql.connect({
            ...SQL_CONFIG,
            database: dbName,
        });
    }
    return sqlPools[dbName];
}

// ===============================
// SUPABASE CLIENT FACTORY
// ===============================

function getSupabaseClient(): SupabaseClient {
    return createClient(
        ENV.db.supabase.url,
        ENV.db.supabase.serviceKey
    );
}

// ===============================
// PAYLOAD BUILDER (UNIVERSAL)
// ===============================

function buildPayload(payload: any) {
    return {
        ParamObj: payload?.params || {},
        FormObj: payload?.form || {},
    };
}

// ===============================
// RESULT NORMALIZERS
// ===============================

function normalizeSqlResult(result: any) {
    const recordsets = Array.isArray(result?.recordsets)
        ? result.recordsets
        : Object.values(result?.recordsets || {});

    const firstRow = recordsets?.[0]?.[0] || {};

    return {
        StatusCode: firstRow.StatusCode ?? 200,
        Message: firstRow.Message ?? "Success",
        DataSet: recordsets,
    };
}

function normalizeSupabaseResult(data: any, error?: any) {
    if (error) {
        return {
            StatusCode: 500,
            Message: error.message,
            DataSet: [],
        };
    }

    return {
        StatusCode: data?.StatusCode ?? 200,
        Message: data?.Message ?? "Success",
        DataSet: data?.DataSet ?? data ?? [],
    };
}

// ===============================
// SQL SERVER ADAPTER
// ===============================

async function executeSqlProcedure(
    dbName: string,
    procedure: string,
    payload: any
) {
    const pool = await getSqlPool(dbName);
    const request = pool.request();

    const { ParamObj, FormObj } = buildPayload(payload);

    request.input("ParamObj", sql.NVarChar(sql.MAX), JSON.stringify(ParamObj));
    request.input("FormObj", sql.NVarChar(sql.MAX), JSON.stringify(FormObj));

    const result = await request.execute(procedure);

    return normalizeSqlResult(result);
}

// ===============================
// SUPABASE ADAPTER (RPC STYLE)
// ===============================

async function executeSupabaseProcedure(
    procedure: string,
    payload: any
) {
    const supabase = getSupabaseClient();
    const { ParamObj, FormObj } = buildPayload(payload);

    const { data, error } = await supabase.rpc(procedure, {
        ParamObj,
        FormObj,
    });

    return normalizeSupabaseResult(data, error);
}

// ===============================
// UNIVERSAL PROCEDURE ENGINE
// ===============================

export async function runProcedure(options: {
    dbType: "sql" | "supabase";
    dbName?: string;
    procedure: string;
    payload: any;
}) {
    const { dbType, dbName, procedure, payload } = options;

    if (!procedure) {
        throw new Error("Procedure name is required");
    }

    switch (dbType) {
        case "sql":
            if (!dbName) {
                throw new Error("Database name is required for SQL Server");
            }
            return executeSqlProcedure(dbName, procedure, payload);

        case "supabase":
            return executeSupabaseProcedure(procedure, payload);

        default:
            throw new Error(`Unsupported DB type: ${dbType}`);
    }
}
