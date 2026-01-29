import sql from "mssql";
import { createClient } from "@supabase/supabase-js";
import { ENV } from "../config/env";
import { SQL_CONFIG } from "../config/db";

// ===============================
// DB CACHE (per project)
// ===============================
const DB_CACHE: Record<string, "sql" | "supabase"> = {};

// ===============================
// SQL POOL MANAGER (per database)
// ===============================
const sqlPools: Record<string, sql.ConnectionPool> = {};

async function getSqlPool(dbName: string) {
    if (!sqlPools[dbName]) {
        sqlPools[dbName] = await sql.connect({
            ...SQL_CONFIG,
            database: dbName,
        });
    }
    return sqlPools[dbName];
}

// ===============================
// SUPABASE CLIENT (singleton)
// ===============================
const supabase = createClient(
    ENV.db.supabase.url,
    ENV.db.supabase.serviceKey
);

// ===============================
// PAYLOAD BUILDER (Techmark Style)
// ===============================
function buildPayload(payload: any) {
    return {
        ParamObj: payload?.params || {},
        FormObj: payload?.form || {},
    };
}

// ===============================
// SQL RESULT NORMALIZER (Techmark)
// ===============================
function normalizeSqlResult(result: any, meta?: any) {
    const recordsets = Array.isArray(result?.recordsets)
        ? result.recordsets
        : Object.values(result?.recordsets || {});

    const firstRow = recordsets?.[0]?.[0] || {};

    return {
        StatusCode: firstRow.StatusCode ?? 200,
        Message: firstRow.Message ?? "Success",
        DataSet: recordsets,
        Meta: meta,
    };
}

// ===============================
// SUPABASE RESULT NORMALIZER (Techmark)
// ===============================
function normalizeSupabaseResult(data: any, error?: any, meta?: any) {
    if (error) {
        return {
            StatusCode: 500,
            Message: error.message,
            DataSet: [],
            Meta: meta,
        };
    }

    // If Supabase function already returns Techmark-style object
    if (data?.StatusCode !== undefined) {
        return {
            StatusCode: data.StatusCode,
            Message: data.Message ?? "Success",
            DataSet: data.DataSet ?? [],
            Meta: meta,
        };
    }

    // Wrap raw data into Techmark dataset
    return {
        StatusCode: 200,
        Message: "Success",
        DataSet: Array.isArray(data) ? [data] : [[data]],
        Meta: meta,
    };
}

// ===============================
// SQL PROCEDURE EXECUTOR
// ===============================
async function runSqlProcedure(
    dbName: string,
    procedure: string,
    payload: any,
    project: string
) {
    const pool = await getSqlPool(dbName);
    const request = pool.request();

    const { ParamObj, FormObj } = buildPayload(payload);

    request.input("ParamObj", sql.NVarChar(sql.MAX), JSON.stringify(ParamObj));
    request.input("FormObj", sql.NVarChar(sql.MAX), JSON.stringify(FormObj));

    const result = await request.execute(procedure);

    return normalizeSqlResult(result, {
        project,
        db: "sql",
        mode: "procedure",
    });
}

// ===============================
// SUPABASE PROCEDURE EXECUTOR
// (Postgres function = procedure abstraction)
// ===============================
async function runSupabaseProcedure(
    procedure: string,
    payload: any,
    project: string
) {
    const { ParamObj, FormObj } = buildPayload(payload);

    const { data, error } = await supabase.rpc(procedure, {
        ParamObj,
        FormObj,
    });

    return normalizeSupabaseResult(data, error, {
        project,
        db: "supabase",
        mode: "procedure",
    });
}

// ===============================
// HYBRID DB ENGINE (AUTO DETECT)
// ===============================
export async function dbEngine(
    project: string,
    dbName: string,
    procedure: string,
    payload: any
) {
    // 1️⃣ Use cached DB if already detected
    const cached = DB_CACHE[project];

    if (cached === "sql") {
        return runSqlProcedure(dbName, procedure, payload, project);
    }

    if (cached === "supabase") {
        return runSupabaseProcedure(procedure, payload, project);
    }

    // 2️⃣ Try SQL first (SQL-first architecture)
    try {
        const res = await runSqlProcedure(dbName, procedure, payload, project);
        DB_CACHE[project] = "sql";
        console.log(`✅ [${project}] DB detected: SQL Server`);
        return res;
    } catch (err) {
        console.warn(`⚠️ [${project}] SQL failed → switching to Supabase`);
    }

    // 3️⃣ Fallback to Supabase
    const res = await runSupabaseProcedure(procedure, payload, project);
    DB_CACHE[project] = "supabase";
    console.log(`✅ [${project}] DB detected: Supabase`);
    return res;
}
