export interface IDailyActivityPoint {
    date: string;
    count: number;
}

export interface IHourlyActivityPoint {
    hour: number;
    count: number;
}

export interface ITenantTodaySales {
    total: number;
    hourly: IHourlyActivityPoint[];
}

export interface ITenantActivityReport {
    daily: IDailyActivityPoint[];
    hourly: IHourlyActivityPoint[];
    today_sales: ITenantTodaySales;
}
