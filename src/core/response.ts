export interface EngineResponse<T = any> {
    StatusCode: number;
    Message: string;
    DataSet: T;
}
