/**
 * This file validates incoming engine requests before execution.
 */

import { EngineRequest } from "../contract/request";

/**
 * Validates the request structure.
 * Throws error if invalid.
 */
export function validateRequest(body: any): EngineRequest {
    if (!body || typeof body !== "object") {
        throw new Error("Invalid request body");
    }

    if (!body.procedure || typeof body.procedure !== "string") {
        throw new Error("Procedure is required");
    }

    if (body.project && typeof body.project !== "string") {
        throw new Error("Project must be a string");
    }

    if (body.payload && typeof body.payload !== "object") {
        throw new Error("Payload must be an object");
    }

    return body as EngineRequest;
}
