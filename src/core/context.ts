/**
 * This file loads and caches project configuration from /projects/{project}/config.json.
 * It is used by the engine to resolve database names and project settings.
 */

import fs from "fs";
import path from "path";
import { ENV } from "../config/env";

export type ProjectConfig = {
    project: string;
    masterDb?: string;
    clientDb?: string;
    procedures?: {
        allowed?: string[];
    };
};


const cache: Record<string, ProjectConfig> = {};

/**
 * Resolves the path of the project config file (supports src and dist).
 */
function getProjectConfigPath(project: string) {
    const baseDir = process.cwd();
    const paths = [
        path.join(baseDir, "src", "projects", project, "config.json"),
        path.join(baseDir, "dist", "projects", project, "config.json"),
    ];

    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }

    throw new Error(`Project config not found: ${project}`);
}

/**
 * Loads and returns the project configuration with caching.
 */
export function getContext(projectName?: string): ProjectConfig {
    const project = projectName || ENV.project;

    if (!project) {
        throw new Error("Project name is not defined in ENV or request");
    }

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
