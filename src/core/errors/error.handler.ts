/**
 * ============================= GLOBAL ERROR HANDLER =============================
 *
 * Ye file backend me throw hone wale errors ko
 * structured EngineResponse me convert karta hai.
 *
 * Purpose:
 * - server crash na ho
 * - raw SQL error frontend ko na mile
 * - standard error response mile
 *
 * Har route, resolver, executor isko use karega.
 */

import { EngineResponse } from "../contract/response";


export function handleError(err: any): EngineResponse {

    const message =
        err?.message ||
        "Internal Server Error";

    return {
        status: {
            code: 500,
            success: false,
            message: message,
        },

        error: {
            code: "SERVER_ERROR",
            message: message,
            details:
                process.env.NODE_ENV === "development"
                    ? err
                    : undefined,
        },

        meta: {
            timestamp: Date.now(),
        },

        // backward compatibility (old frontend safe)
        statusCode: 500,
        message: message,
    };
}
