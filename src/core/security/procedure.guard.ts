/**
 * This file checks whether a procedure is allowed to be executed
 * based on the project configuration.
 */

import { getContext } from "../context";

/**
 * Validates if a procedure is allowed for the given project.
 * Throws an error if the procedure is not permitted.
 */
export function guardProcedure(project: string, procedure: string) {
    const cfg = getContext(project);

    // If no whitelist exists, allow all procedures
    const allowed = (cfg as any).procedures?.allowed;

    if (!allowed || !Array.isArray(allowed)) {
        return true;
    }

    const isAllowed = allowed.includes(procedure);

    if (!isAllowed) {
        throw new Error(`Procedure not allowed: ${procedure}`);
    }

    return true;
}
