/**
 * This file formats engine errors into a consistent response object.
 */

import { EngineResponse } from "../contract/response";

/**
 * Converts any error into EngineResponse format.
 */
export function handleError(err: any): EngineResponse {
    return {
        statusCode: 500,
        message: err?.message || "Internal Server Error",
        data: [],
        meta: {
            timestamp: Date.now(),
        },
    };
}
