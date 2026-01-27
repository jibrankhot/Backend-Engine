import sql from "mssql";
import { createClient } from "@supabase/supabase-js";
import { ENV } from "../config/env";
import { resolveDb } from "./resolver";
import { SQL_CONFIG } from "../config/db";

// ---------- SQL POOL PER DATABASE ----------

const sqlPools: Record<string, sql.ConnectionPool> = {};

// ---------- SUPABASE CLIENT ----------

const supabase = createClient(
    ENV.db.supabase.url,
    ENV.db.supabase.serviceKey
);

// ---------- HELPERS ----------

function buildPayload(payload: any) {
    return {
        ParamObj: payload?.params || {},
        FormObj: payload?.form || {},
    };
}

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
        DataSet: data?.DataSet ?? [],
    };
}

// ---------- SQL SERVER EXECUTOR ----------

async function runSqlServer(procedure: string, payload: any) {
    const dbName = resolveDb(procedure);

    if (!sqlPools[dbName]) {
        sqlPools[dbName] = await sql.connect({
            ...SQL_CONFIG,
            database: dbName,
        });
    }

    const request = sqlPools[dbName].request();
    const { ParamObj, FormObj } = buildPayload(payload);

    request.input("ParamObj", sql.NVarChar(sql.MAX), JSON.stringify(ParamObj));
    request.input("FormObj", sql.NVarChar(sql.MAX), JSON.stringify(FormObj));

    const result = await request.execute(procedure);

    return normalizeSqlResult(result);
}

// ---------- SUPABASE EXECUTOR (PROCEDURE STYLE) ----------

async function runSupabase(procedure: string, payload: any) {
    const { ParamObj, FormObj } = buildPayload(payload);

    const { data, error } = await supabase.rpc(procedure, {
        ParamObj,
        FormObj,
    });

    return normalizeSupabaseResult(data, error);
}

// ---------- UNIVERSAL ENGINE FUNCTION ----------

export async function runProcedure(procedure: string, payload: any) {
    if (ENV.db.primary === "sqlserver") {
        return runSqlServer(procedure, payload);
    }

    if (ENV.db.primary === "supabase") {
        return runSupabase(procedure, payload);
    }

    throw new Error(`Unsupported DB type: ${ENV.db.primary}`);
}
