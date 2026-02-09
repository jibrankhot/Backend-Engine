/**
 * ============================= PROJECT CONTEXT LOADER =============================
 *
 * Ye file backend engine ka configuration brain hai.
 *
 * Resolver aur executor yahin se jaankar lete hain:
 * - project ka naam
 * - master database
 * - client/tenant database
 *
 * Flow:
 *
 * Request → Resolver → getContext() → config.json read → DB decide
 *
 *
 * Ye kya karta hai:
 *
 * 1) /projects/{project}/config.json load karta hai
 * 2) masterDb & clientDb deta hai resolver ko
 * 3) cache maintain karta hai (baar-baar file read nahi hoti)
 * 4) multi-project support deta hai
 *
 *
 * Example config.json:
 *
 * {
 *   "project": "ecom",
 *   "masterDb": "EcomSetup",
 *   "clientDb": "ClientA_DB"
 * }
 *
 *
 * IMPORTANT:
 * Ye file business logic nahi rakhti.
 * Sirf configuration resolution karti hai.
 *
 * Agar ye strong hai → engine easily multi-project ban jata hai.
 *
 * =============================================================================
 */

import fs from "fs";
import path from "path";
import { ENV } from "../config/env";


export type ProjectConfig = {
    project: string;
    masterDb?: string;
    clientDb?: string;
};


// ===============================
// CONFIG CACHE
// ===============================

/**
 * Har project ka config memory me store hota hai.
 * Performance improve hoti hai.
 */
const cache: Record<string, ProjectConfig> = {};


// ===============================
// CONFIG FILE PATH RESOLUTION
// ===============================

/**
 * src aur dist dono environments support karta hai.
 */
function getProjectConfigPath(project: string) {

    const baseDir = process.cwd();

    const possiblePaths = [
        path.join(baseDir, "src", "projects", project, "config.json"),
        path.join(baseDir, "dist", "projects", project, "config.json"),
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) return p;
    }

    throw new Error(`Project config not found for project: ${project}`);
}


// ===============================
// MAIN CONTEXT FUNCTION
// ===============================

/**
 * Resolver yahin se DB configuration leta hai.
 */
export function getContext(projectName?: string): ProjectConfig {

    const project = projectName || ENV.project;

    if (!project) {
        throw new Error("Project name missing in ENV and request");
    }

    // cache check
    if (!cache[project]) {

        const filePath = getProjectConfigPath(project);

        const raw = fs.readFileSync(filePath, "utf-8");
        const cfg = JSON.parse(raw) as ProjectConfig;

        cache[project] = {
            project: cfg.project || project,
            masterDb: cfg.masterDb,
            clientDb: cfg.clientDb,
        };
    }

    return cache[project];
}
