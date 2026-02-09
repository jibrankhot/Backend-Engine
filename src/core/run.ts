import { runProcedure } from "./executor/hybrid.executor";
import { EngineRequest } from "./contract/request";

export async function run(input: {
    project?: string;
    procedure: string;
    params?: any;
    form?: any;
}) {
    const request: EngineRequest = {
        project: input.project,
        action: {
            procedure: input.procedure,
            params: input.params,
            form: input.form
        }
    };
    return runProcedure(request);
}
