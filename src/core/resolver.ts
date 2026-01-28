import { getContext } from "./context";

const MASTER_PREFIX = ["Admin_", "Setup_", "System_"];

export type DbType = "sql" | "supabase";

export interface ResolvedContext {
    dbType: DbType;
    dbName?: string;
    procedure: string;
    payload: any;
    project: string;
}

export function resolveContext(input: {
    project?: string;
    db?: DbType;
    procedure: string;
    params?: any;
    form?: any;
}): ResolvedContext {
    const cfg = getContext();

    const project = input.project || cfg.project || "default";
    const procedure = input.procedure;

    if (!procedure) {
        throw new Error("Procedure name is required");
    }

    // 1️⃣ Decide DB Type (SQL / Supabase)
    const dbType: DbType =
        input.db ||
        cfg.dbType ||
        "sql"; // default = SQL

    // 2️⃣ Decide DB Name (only for SQL)
    let dbName: string | undefined;

    if (dbType === "sql") {
        const isMaster = MASTER_PREFIX.some(p =>
            procedure.startsWith(p)
        );

        dbName = isMaster ? cfg.masterDb : cfg.clientDb;
    }

    // 3️⃣ Build Payload (keep Node thin)
    const payload = {
        params: input.params || {},
        form: input.form || {},
    };

    return {
        project,
        dbType,
        dbName,
        procedure,
        payload,
    };
}
