export type ProcedurePayload = {
    params?: Record<string, any>;
    form?: Record<string, any>;
};

export interface EngineRequest {
    project?: string;
    procedure: string;
    params?: Record<string, any>;
    form?: Record<string, any>;
    payload?: ProcedurePayload;
    meta?: {
        requestId?: string;
        timestamp?: number;
        project?: string;
    };
}
