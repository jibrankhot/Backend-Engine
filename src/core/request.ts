export type ProcedurePayload = {
    params?: Record<string, any>;
    form?: Record<string, any>;
};

export interface EngineRequest {
    procedure: string;
    payload?: ProcedurePayload;
    meta?: {
        requestId?: string;
        timestamp?: number;
        project?: string;
    };
}
