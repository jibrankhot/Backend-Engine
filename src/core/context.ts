import fs from "fs";
import path from "path";
import { ENV } from "../config/env";

type ProjectConfig = {
    project: string;
    masterDb: string;
    clientDb: string;
};

let cache: ProjectConfig | null = null;

export function getContext(): ProjectConfig {
    if (!cache) {
        const filePath = path.join(
            process.cwd(),
            "src",
            "projects",
            ENV.project,
            "config.json"
        );

        const raw = fs.readFileSync(filePath, "utf-8");
        cache = JSON.parse(raw) as ProjectConfig;
    }

    return cache;
}
