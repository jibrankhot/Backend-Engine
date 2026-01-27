import { runProcedure } from "./executor";

export async function run(procedure: string, payload: Record<string, any>) {
    return runProcedure(procedure, payload);
}
