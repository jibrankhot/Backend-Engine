import { runProcedure } from "./executor/hybrid.executor";
import { EngineRequest } from "./contract/request";
import { guardProcedure } from "./security/procedure.guard";
import { ENV } from "../config/env";

/**
 * Universal engine entry point
 * Flow:
 * run → guard → resolver → executor
 */
export async function run(request: EngineRequest) {

    // Resolve project
    const project = request.project || ENV.project;

    const procedure =
        request.action?.procedure ||
        (request as any)?.procedure;

    if (!procedure) {
        throw {
            type: "INVALID_REQUEST",
            message: "Procedure name missing"
        };
    }

    // Guard BEFORE SQL execution
    guardProcedure(project, procedure);

    // Attach project into request
    request.project = project;

    // Execute through executor pipeline
    return runProcedure(request);
}
