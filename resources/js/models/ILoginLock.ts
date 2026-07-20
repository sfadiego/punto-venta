export interface ILoginLockIp {
    ip: string;
    attempts: number;
    retry_after: number;
}

export interface ILoginLockStatus {
    blocked: boolean;
    ips: ILoginLockIp[];
}
