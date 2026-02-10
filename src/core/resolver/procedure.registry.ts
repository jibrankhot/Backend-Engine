/**
 * ============================================================
 * Procedure Registry Loader
 * ============================================================
 * Hinglish Explanation:
 * Yeh file project-specific procedures.json load karti hai
 * aur batati hai kaunsa procedure kis DB me run hoga.
 *
 * Ab resolver ko hardcoded logic ki zarurat nahi padegi.
 * Sab kuch registry driven hoga.
 *
 * Flow:
 * request → project detect → procedures.json load → DB mapping return
 * ============================================================
 */

import fs from "fs";
import path from "path";

type ProcedureConfig = {
    db: "MASTER" | "TENANT";
};

type ProceduresFile = {
    procedures: Record<string, ProcedureConfig>;
};

let cachedRegistries: Record<string, ProceduresFile> = {};

/**
 * Load procedures.json for a project
 */
function loadProcedures(project: string): ProceduresFile {
    if (cachedRegistries[project]) return cachedRegistries[project];

    const filePath = path.join(
        process.cwd(),
        "src",
        "platform",
        project,
        "procedures.json"
    );


    if (!fs.existsSync(filePath)) {
        throw new Error(`procedures.json not found for project: ${project}`);
    }

    const raw = fs.readFileSync(filePath, "utf-8");

    try {
        const parsed: ProceduresFile = JSON.parse(raw);

        if (!parsed.procedures) {
            throw new Error("Invalid procedures.json structure");
        }

        cachedRegistries[project] = parsed;
        return parsed;
    } catch (err) {
        throw new Error(`Invalid JSON in procedures.json for project: ${project}`);
    }
}

/**
 * Validate and get DB mapping for procedure
 */
export function getProcedureDb(
    project: string,
    procedureName: string
): "MASTER" | "TENANT" {
    const registry = loadProcedures(project);

    const proc = registry.procedures[procedureName];

    if (!proc) {
        throw new Error(
            `Procedure '${procedureName}' not registered in project '${project}'`
        );
    }

    return proc.db;
}
