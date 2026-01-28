import fs from "fs";
import path from "path";
import { ENV } from "../config/env";

export type DbType = "sql" | "supabase";

export type ProjectConfig = {
    project: string;
    dbType?: DbType;       // default: sql
    masterDb?: string;     // only for SQL
    clientDb?: string;     // only for SQL
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

    if (!cache[project]) {
        const filePath = getProjectConfigPath(project);
        const raw = fs.readFileSync(filePath, "utf-8");

        const cfg = JSON.parse(raw) as ProjectConfig;

        // Defaults (keep engine stable)
        cache[project] = {
            project: cfg.project || project,
            dbType: cfg.dbType || "sql",
            masterDb: cfg.masterDb,
            clientDb: cfg.clientDb,
        };
    }

    return cache[project];
}
