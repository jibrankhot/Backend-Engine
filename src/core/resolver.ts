import { getContext } from "./context";

const MASTER_PREFIX = ["Admin_", "Setup_", "System_"];

export interface ResolvedContext {
    project: string;
    dbName?: string; // only for SQL
    procedure: string;
    payload: any;
}

export function resolveContext(input: {
    project?: string;
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

    // ✅ Decide DB Name (SQL only, engine will decide SQL/Supabase)
    let dbName: string | undefined;

    const isMaster = MASTER_PREFIX.some(p =>
        procedure.startsWith(p)
    );

    dbName = isMaster ? cfg.masterDb : cfg.clientDb;

    // ✅ Build Payload (Node remains thin)
    const payload = {
        params: input.params || {},
        form: input.form || {},
    };

    return {
        project,
        dbName,
        procedure,
        payload,
    };
}
