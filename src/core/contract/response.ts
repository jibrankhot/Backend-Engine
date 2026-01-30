/**
 * This file defines the standard response structure returned by the backend engine.
 * Every API call returns this format so clients can handle success, errors, and metadata consistently.
 */

export interface EngineResponse<T = any> {
    /** Numeric status code returned by the engine */
    statusCode: number;

    /** Human-readable message describing the result */
    message: string;

    /** Actual data returned from the database procedure */
    data: T;

    /** Engine metadata about the execution */
    meta?: {
        project?: string;
        db?: "sql" | "supabase";
        requestId?: string;
        timestamp?: number;
        durationMs?: number;
    };
}
