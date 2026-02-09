/**
 * ============================= REQUEST VALIDATOR (NEW CONTRACT ONLY) =============================
 *
 * Ye validator sirf NEW request structure accept karega.
 *
 * Required format:
 *
 * {
 *   action: {
 *     procedure: "ProcName",
 *     params: {},
 *     form: {}
 *   },
 *   auth: {},
 *   meta: {}
 * }
 *
 * Old format (procedure top-level, payload) → reject hoga.
 *
 * Purpose:
 * - engine ko clean rakhna
 * - strict contract enforce karna
 * - future bugs avoid karna
 */

import { EngineRequest } from "../contract/request";


export function validateRequest(body: any): EngineRequest {

    if (!body || typeof body !== "object") {
        throw new Error("Invalid request body");
    }

    // -------------------------------
    // ACTION REQUIRED
    // -------------------------------

    if (!body.action || typeof body.action !== "object") {
        throw new Error("Action object is required");
    }

    // -------------------------------
    // PROCEDURE REQUIRED
    // -------------------------------

    if (!body.action.procedure || typeof body.action.procedure !== "string") {
        throw new Error("action.procedure is required");
    }

    // -------------------------------
    // PARAMS VALIDATION
    // -------------------------------

    if (body.action.params && typeof body.action.params !== "object") {
        throw new Error("action.params must be an object");
    }

    // -------------------------------
    // FORM VALIDATION
    // -------------------------------

    if (body.action.form && typeof body.action.form !== "object") {
        throw new Error("action.form must be an object");
    }

    // -------------------------------
    // AUTH VALIDATION
    // -------------------------------

    if (body.auth && typeof body.auth !== "object") {
        throw new Error("auth must be an object");
    }

    // -------------------------------
    // META VALIDATION
    // -------------------------------

    if (body.meta && typeof body.meta !== "object") {
        throw new Error("meta must be an object");
    }

    return body as EngineRequest;
}
