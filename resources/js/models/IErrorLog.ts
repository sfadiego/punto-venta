export interface IErrorLog {
    id: number;
    source: "frontend" | "backend";
    endpoint: string;
    method: string;
    status_code: number;
    error_message: string;
    request_payload: Record<string, unknown> | null;
    response_body: Record<string, unknown> | null;
    user_agent: string | null;
    url: string | null;
    created_at: string;
    updated_at: string;
}
