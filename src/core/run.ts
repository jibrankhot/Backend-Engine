import { runProcedure } from "./executor";

export async function run(input: {
    project?: string;
    procedure: string;
    params?: any;
    form?: any;
}) {
    return runProcedure(input);
}
