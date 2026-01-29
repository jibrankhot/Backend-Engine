import fs from "fs";
import path from "path";
import { ENV } from "../config/env";

export type ProjectConfig = {
    project: string;
    masterDb?: string;     // SQL master DB
    clientDb?: string;     // SQL client DB

    // ⚠️ backward compatibility (ignored by engine)
    dbType?: "sql" | "supabase";
};

const cache: Record<string, ProjectConfig> = {};

// Resolve base path (works for src & dist)
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

export function getContext(projectName?: string): ProjectConfig {
    const project = projectName || ENV.project;

    if (!project) {
        throw new Error("Project name is not defined in ENV or request");
    }

    // ✅ cached config
    if (!cache[project]) {
        const filePath = getProjectConfigPath(project);
        const raw = fs.readFileSync(filePath, "utf-8");

        const cfg = JSON.parse(raw) as ProjectConfig;

        cache[project] = {
            project: cfg.project || project,
            masterDb: cfg.masterDb,
            clientDb: cfg.clientDb,
            dbType: cfg.dbType, // kept only for compatibility (not used)
        };
    }

    return cache[project];
}
