export interface IDailyActivityPoint {
    date: string;
    count: number;
}

export interface IHourlyActivityPoint {
    hour: number;
    count: number;
}

export interface ITenantActivityReport {
    daily: IDailyActivityPoint[];
    hourly: IHourlyActivityPoint[];
}
