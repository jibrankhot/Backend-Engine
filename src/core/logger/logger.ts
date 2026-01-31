/**
 * This file logs request execution details.
 */

type LogMeta = {
    project?: string;
    procedure?: string;
    db?: string;
    durationMs?: number;
};

/**
 * Logs a successful execution.
 */
export function logSuccess(meta: LogMeta) {
    console.log(
        `[SUCCESS] project=${meta.project} procedure=${meta.procedure} db=${meta.db} duration=${meta.durationMs}ms`
    );
}

/**
 * Logs an execution error.
 */
export function logError(meta: LogMeta, err: any) {
    console.error(
        `[ERROR] project=${meta.project} procedure=${meta.procedure} db=${meta.db} message=${err?.message}`
    );
}
