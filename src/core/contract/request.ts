/**
 * This file defines the standard request structure used by the backend engine.
 * Every API call must follow this format so the engine can route and execute
 * the correct database procedure with the given payload.
 */

/**
 * Payload sent to the database procedure.
 * - params: simple key-value inputs (ids, flags, filters)
 * - data: complex objects (forms, JSON data)
 */
export interface EnginePayload {
    params?: Record<string, any>;
    data?: Record<string, any>;
}

/**
 * Metadata used by the engine for tracking and debugging requests.
 */
export interface EngineMeta {
    requestId?: string;
    timestamp?: number;
    source?: string;
}

/**
 * Main request object handled by the engine.
 * - project: selects project config from /projects folder
 * - procedure: database procedure or RPC name to execute
 * - payload: input data for the procedure
 * - meta: engine-level metadata
 */
export interface EngineRequest {
    project?: string;
    procedure: string;
    payload?: EnginePayload;
    meta?: EngineMeta;
}
