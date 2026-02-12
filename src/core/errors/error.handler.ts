/**
 * ============================= GLOBAL ERROR HANDLER =============================
 *
 * Converts all thrown errors into structured EngineResponse.
 * Supports engine-level error types:
 *
 * INVALID_REQUEST → 400
 * PROCEDURE_NOT_ALLOWED → 403
 * SERVER_ERROR → 500
 *
 * SQL errors remain 500.
 * ============================================================
 */

import { EngineResponse } from "../contract/response";

export function handleError(err: any): EngineResponse {

    let code = 500;
    let errorCode = "SERVER_ERROR";
    let message = "Internal Server Error";

    // Engine structured errors
    if (err?.type) {

        message = err.message || message;

        switch (err.type) {

            case "INVALID_REQUEST":
                code = 400;
                errorCode = "INVALID_REQUEST";
                break;

            case "PROCEDURE_NOT_ALLOWED":
                code = 403;
                errorCode = "PROCEDURE_NOT_ALLOWED";
                break;

            default:
                code = 500;
                errorCode = "SERVER_ERROR";
        }
    }

    // Normal JS / SQL errors
    else if (err?.message) {
        message = err.message;
    }

    return {
        status: {
            code,
            success: false,
            message,
        },

        error: {
            code: errorCode,
            message,
            details:
                process.env.NODE_ENV === "development"
                    ? err
                    : undefined,
        },

        meta: {
            timestamp: Date.now(),
        },

        // backward compatibility for old frontend
        statusCode: code,
        message,
    };
}
