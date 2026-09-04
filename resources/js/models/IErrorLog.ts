export interface IErrorLogUser {
    id: number;
    nombre: string;
    apellido_paterno: string;
    email: string;
}

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
    user_id: number | null;
    tenant_slug: string | null;
    user: IErrorLogUser | null;
    created_at: string;
    updated_at: string;
}
