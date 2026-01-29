export interface EngineResponse<T = any> {
    StatusCode: number;
    Message: string;
    DataSet: T;

    Meta?: {
        project?: string;
        db?: "sql" | "supabase";
        requestId?: string;
        timestamp?: number;
    };
}
