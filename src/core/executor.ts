import { resolveContext } from "./resolver";
import { dbEngine } from "./db-engine";

// ===============================
// EXECUTOR (THIN ENGINE WRAPPER)
// ===============================

export async function runProcedure(input: {
    project?: string;
    procedure: string;
    params?: any;
    form?: any;
}) {
    // 1️⃣ Resolve context (project, dbName, procedure, payload)
    const ctx = resolveContext(input);

    const { project, dbName, procedure, payload } = ctx;

    // 2️⃣ Call hybrid DB engine (SQL → Supabase auto)
    const result = await dbEngine(
        project,
        dbName!,
        procedure,
        payload
    );

    // 3️⃣ Return Techmark-style response
    return result;
}
